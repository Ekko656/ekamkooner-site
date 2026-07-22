/* ============================================================
   THE ASSEMBLY.

   Exploded real SO-ARM101 parts build themselves as the About
   page scrolls. Every part's flight window ends inside the
   master range so the machine truly completes. At 100 percent
   the baked parts swap for the live articulated robot, a lock
   pulse fires, and the machine starts moving: light, airy,
   slow joint drift, never snappy.
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import URDFLoader from 'urdf-loader'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { session } from '../lib/session'

type Part = {
  geom: THREE.BufferGeometry
  mat: THREE.Material
  aPos: THREE.Vector3
  aQuat: THREE.Quaternion
  ePos: THREE.Vector3
  eQuat: THREE.Quaternion
  mPos: THREE.Vector3
  w0: number
  w1: number
  seed: number
}

type Joints = Record<string, { setJointValue: (v: number) => void }>

/* display pose: the natural SO-ARM101 stance, seen in profile so the
   bend actually reads on screen: base yawed sideways, upper arm leaning,
   clear elbow bend, gripper held level */
/* The finished stance: bent forward over its own base, elbow clearly
   broken, the claw hanging BELOW the elbow joint and reaching out toward
   the viewer. It must never stand up straight.

   These numbers are not eyeballed. They were solved from the URDF chain
   (see the forward-kinematics probe in the commit history) against two
   hard constraints, with the wrist roll pinned to zero so the gripper
   stays square:
     claw tip 0.10 below the elbow joint in world height
     claw tip 0.13 in front of the elbow, toward the camera
   Measured result: elbow y=0.234, tip y=0.134, elbow z=0.086, tip z=0.216. */
const DISPLAY_POSE: Record<string, number> = {
  Rotation: 0.8,
  Pitch: 0.5,
  Elbow: -0.71,
  Wrist_Pitch: 1.34,
  Wrist_Roll: 0,
  Jaw: 0.62,
}
const JOINT_NAMES = ['Rotation', 'Pitch', 'Elbow', 'Wrist_Pitch', 'Wrist_Roll', 'Jaw'] as const

/* ---- the closing performance ----
   Not scrubbed by scroll. When the reader reaches the end zone the arm
   performs once, on its own clock, like a studio-logo animation:
     anticipation - coil back, jaw yawns wide open
     dive         - plunge the claw down below the bottom of the frame
     GRAB         - the jaw clamps hard shut on the card waiting there
     strain       - it is heavier than it looks; a brief pull before it gives
     haul         - lift the card up into full view, jaw still clamped
     TOSS         - at the top, snap the jaw open and let the card fly to
                    its resting place
     settle       - the arm eases back down out of the card's way

   The card is only held during grab -> toss, briefly and in motion, so
   the flat card and the 3D claw never have to line up while static. The
   Jaw clamps to near its closed limit (-0.14) so the gripper visibly
   grips down, and opens wide (1.35) to release. `grab01` is 1 only while
   the card is held. Elbow keeps one sign throughout: crossing zero
   straightens the arm into the vertical stance this page must not show. */
type Gesture = Record<string, number> & { grab01: number }
const makeGesture = (): Gesture => ({ ...DISPLAY_POSE, grab01: 0 }) as Gesture
/* the stance the arm holds after the toss: the proud finished display
   stance, not a droop. It follows through past the release and settles
   back up, the way a hand does after letting something go. */
const AFTER_POSE: Record<string, number> = {
  Rotation: 0.8,
  Pitch: 0.42,
  Elbow: -0.82,
  Wrist_Pitch: 1.22,
  Wrist_Roll: 0,
  Jaw: 0.55,
}
const buildCardTimeline = (gest: Gesture) =>
  gsap
    .timeline({ paused: true })
    /* anticipation: coil back, jaw yawns wide */
    .to(gest, { Pitch: 0.2, Elbow: -0.85, Jaw: 1.5, duration: 0.45, ease: 'power2.out' }, 0)
    /* the dive: plunge the claw down out of the bottom of the frame */
    .to(gest, { Pitch: 1.3, Elbow: -0.5, Wrist_Pitch: 1.55, duration: 0.55, ease: 'power3.in' }, 0.42)
    /* GRAB: the jaw slams shut on the back of the card, hard. -0.14 is
       almost the closed limit, so the gripper visibly clamps down. */
    .to(gest, { Jaw: -0.14, grab01: 1, duration: 0.13, ease: 'power4.out' }, 1.02)
    /* the strain: heavier than it looks, it resists before it gives */
    .to(gest, { Pitch: 1.18, duration: 0.24, ease: 'power2.inOut' }, 1.22)
    /* the haul: swing up hard and fast, carrying the card with it */
    .to(gest, { Pitch: -0.3, Elbow: -1.15, Wrist_Pitch: 0.82, duration: 0.95, ease: 'power2.out' }, 1.52)
    /* RELEASE mid-swing, not at the top: the jaw snaps open while the
       claw is still travelling, so the card leaves on the arc's momentum
       and is thrown clear. Holding it to the top of the reach is exactly
       where the flat card and the 3D claw stop lining up. */
    .to(gest, { Jaw: 1.3, grab01: 0, duration: 0.12, ease: 'power4.out' }, 1.94)
    /* follow through past the release, then settle back to the proud
       finished stance - the arm never droops */
    .to(gest, { Pitch: -0.42, Elbow: -1.2, duration: 0.4, ease: 'power2.out' }, 2.06)
    .to(gest, { ...AFTER_POSE, duration: 1.0, ease: 'power2.inOut' }, 2.5)

/* light airy idle drift: layered slow sines per joint, tiny amplitudes */
/* kept small on Rotation and Wrist_Roll: a wide yaw drift swings the
   machine out of the frame the camera is holding, and rolling the wrist
   spoils the square-on claw the stance is built around */
const IDLE_AMP: Record<string, number> = {
  Rotation: 0.1,
  Pitch: 0.05,
  Elbow: 0.08,
  Wrist_Pitch: 0.1,
  Wrist_Roll: 0.06,
  Jaw: 0.08,
}
/* the freer idle the machine falls into once the card is delivered and it
   has nothing left to do: wider, lazier travel on every joint */
const IDLE_LIVE: Record<string, number> = {
  /* kept small: this rides on top of the look sway, and the two together
     must stay well inside the bound that keeps the machine facing front */
  Rotation: 0.06,
  Pitch: 0.13,
  Elbow: 0.19,
  Wrist_Pitch: 0.27,
  Wrist_Roll: 0.24,
  Jaw: 0.1,
}
const IDLE_SPD: Record<string, number> = {
  Rotation: 0.11,
  Pitch: 0.09,
  Elbow: 0.07,
  Wrist_Pitch: 0.14,
  Wrist_Roll: 0.17,
  Jaw: 0.12,
}
const IDLE_SEED: Record<string, number> = {
  Rotation: 1.3,
  Pitch: 4.7,
  Elbow: 8.1,
  Wrist_Pitch: 2.9,
  Wrist_Roll: 6.2,
  Jaw: 9.8,
}

const fbm = (t: number, seed: number) =>
  Math.sin(t + seed) * 0.55 + Math.sin(t * 0.43 + seed * 2.1) * 0.3 + Math.sin(t * 1.7 + seed * 4.3) * 0.15

const ARM_SCALE = 7.2

const smooth01 = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1)
  return t * t * (3 - 2 * t)
}

/* colour: warm white printed shell, gunmetal servos, brushed steel base.
   No blue anywhere on the machine. */
function makeMats() {
  const shell = new THREE.MeshStandardMaterial({
    color: '#e9edf5',
    metalness: 0.35,
    roughness: 0.4,
    envMapIntensity: 0.85,
  })
  const servo = new THREE.MeshStandardMaterial({
    color: '#4a5160',
    metalness: 0.8,
    roughness: 0.32,
    envMapIntensity: 1.25,
  })
  const base = new THREE.MeshStandardMaterial({
    color: '#b6bcc9',
    metalness: 0.6,
    roughness: 0.34,
    envMapIntensity: 0.95,
  })
  const pick = (src: string) => {
    if (src.includes('sts3215')) return servo
    if (src.includes('base_so101') || src.includes('base_motor_holder')) return base
    return shell
  }
  return { pick }
}

export default function ArmAssembly() {
  const [parts, setParts] = useState<Part[] | null>(null)
  const outer = useRef<(THREE.Group | null)[]>([])
  const root = useRef<THREE.Group>(null)
  const partsGroup = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const locked = useRef(false)
  const seated = useRef<boolean[]>([])
  const lockPulse = useRef({ s: 0 })
  const liveRobot = useRef<THREE.Object3D | null>(null)
  const liveJoints = useRef<Joints | null>(null)
  const liveAt = useRef(0)
  const jawLink = useRef<THREE.Object3D | null>(null)
  const gripV = useMemo(() => new THREE.Vector3(), [])
  const gest = useMemo(makeGesture, [])
  const cardTl = useRef<gsap.core.Timeline | null>(null)
  const inZone = useRef(false)

  useEffect(() => {
    cardTl.current = buildCardTimeline(gest)
    return () => {
      cardTl.current?.kill()
      cardTl.current = null
      session.grip.active = false
      session.gripHold = false
    }
  }, [gest])

  useEffect(() => {
    const manager = new THREE.LoadingManager()
    const loader = new URDFLoader(manager)
    ;(loader as unknown as { packages: Record<string, string> }).packages = {
      so_arm_description: '/so101',
    }
    ;(loader as unknown as {
      loadMeshCb: (
        p: string,
        m: THREE.LoadingManager,
        material: THREE.Material,
        done: (o: THREE.Object3D) => void,
      ) => void
    }).loadMeshCb = (path, m, _material, done) => {
      new STLLoader(m).load(path, (geom) => {
        geom.computeVertexNormals()
        const mesh = new THREE.Mesh(geom)
        mesh.userData.src = path
        done(mesh)
      })
    }

    let robot: THREE.Object3D | null = null
    loader.load('/so101/so101.urdf', (r: THREE.Object3D) => (robot = r))

    manager.onLoad = () => {
      if (!robot) return
      const { pick } = makeMats()
      const joints = (robot as unknown as { joints: Joints }).joints
      Object.entries(DISPLAY_POSE).forEach(([n, v]) => joints[n]?.setJointValue(v))

      const rig = new THREE.Group()
      rig.rotation.x = -Math.PI / 2
      rig.add(robot)
      rig.updateMatrixWorld(true)

      const collected: Omit<Part, 'w0' | 'w1'>[] = []
      const centroid = new THREE.Vector3()
      const tmpP = new THREE.Vector3()
      const tmpQ = new THREE.Quaternion()
      const tmpS = new THREE.Vector3()

      robot.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (!mesh.isMesh) return
        const src = String(mesh.userData.src ?? '')
        if (src.includes('waveshare_mounting_plate')) {
          mesh.visible = false
          return
        }
        const mat = pick(src)
        mesh.material = mat
        mesh.castShadow = true
        mesh.updateWorldMatrix(true, false)
        mesh.matrixWorld.decompose(tmpP, tmpQ, tmpS)
        collected.push({
          geom: mesh.geometry as THREE.BufferGeometry,
          mat,
          aPos: tmpP.clone().multiplyScalar(ARM_SCALE),
          aQuat: tmpQ.clone(),
          ePos: new THREE.Vector3(),
          eQuat: new THREE.Quaternion(),
          mPos: new THREE.Vector3(),
          seed: Math.random() * 100,
        })
        centroid.add(collected[collected.length - 1].aPos)
      })
      centroid.divideScalar(collected.length)

      /* exploded diagram: spread every part evenly over a fibonacci sphere,
         squashed into a tall narrow ellipsoid and biased to the right, so
         the whole cloud lives in the right half of the opening frame and
         never drifts under the text column. (No normalize after squashing:
         that would silently undo the flattening for equator parts.) */
      const N = collected.length
      const golden = Math.PI * (3 - Math.sqrt(5))
      const cloudCenter = centroid.clone().add(new THREE.Vector3(0, 0.5, 0.2))
      const axis = new THREE.Vector3()
      const dir = new THREE.Vector3()
      const planned: Part[] = collected.map((p, i) => {
        const yy = 1 - (i / Math.max(1, N - 1)) * 2 // 1 .. -1
        const ringR = Math.sqrt(Math.max(0, 1 - yy * yy))
        const theta = golden * i
        /* tall and narrow: generous vertical spread, tight horizontal and
           depth spread, so the diagram reads as a column beside the text */
        dir.set(Math.cos(theta) * ringR * 0.6, yy, Math.sin(theta) * ringR * 0.55)
        const R = 2.0 + (i % 4) * 0.3
        p.ePos.copy(cloudCenter).addScaledVector(dir, R)
        axis.set(Math.sin(p.seed), Math.cos(p.seed * 2.1), Math.sin(p.seed * 1.3)).normalize()
        p.eQuat.copy(p.aQuat).multiply(new THREE.Quaternion().setFromAxisAngle(axis, 0.5 + (i % 3) * 0.28))
        /* arc waypoint bows outward along its own ray, so flight paths fan
           apart instead of crossing through one another */
        p.mPos
          .copy(p.ePos)
          .lerp(p.aPos, 0.5)
          .addScaledVector(dir, 0.55)
        return p as Part
      })

      /* base up windows that all END inside the master range, so the
         final part seats exactly at 100 percent, nothing left floating */
      const order = planned
        .map((p, i) => ({ i, y: p.aPos.y }))
        .sort((a, b) => a.y - b.y)
      const n = order.length
      const WINDOW = 0.13
      order.forEach(({ i }, rank) => {
        const start = (rank / Math.max(1, n - 1)) * (1 - WINDOW)
        planned[i].w0 = start
        planned[i].w1 = start + WINDOW
      })

      /* keep the live articulated robot for the post lock life */
      liveRobot.current = rig
      liveJoints.current = joints
      rig.visible = false

      setParts(planned)
    }
  }, [])

  /* mount the live robot rig under the root group once parts exist */
  useEffect(() => {
    if (!parts || !root.current || !liveRobot.current) return
    const rig = liveRobot.current
    rig.scale.setScalar(ARM_SCALE)
    root.current.add(rig)
    return () => {
      root.current?.remove(rig)
    }
  }, [parts])

  const bez = useMemo(() => new THREE.Vector3(), [])
  const evalPart = (p: Part, g: THREE.Group, master: number) => {
    const t = smooth01((master - p.w0) / (p.w1 - p.w0))
    const u = 1 - t
    bez.set(
      u * u * p.ePos.x + 2 * u * t * p.mPos.x + t * t * p.aPos.x,
      u * u * p.ePos.y + 2 * u * t * p.mPos.y + t * t * p.aPos.y,
      u * u * p.ePos.z + 2 * u * t * p.mPos.z + t * t * p.aPos.z,
    )
    g.position.copy(bez)
    g.quaternion.slerpQuaternions(p.eQuat, p.aQuat, t)
    return t
  }

  useFrame(({ clock, camera, size }, dt) => {
    if (!parts) return
    const k = 1 - Math.exp(-4.2 * dt)
    session.assembly += (session.assemblyTarget - session.assembly) * k
    const p = session.assembly
    const t = clock.elapsedTime

    const live = locked.current
    if (partsGroup.current) partsGroup.current.visible = !live
    if (liveRobot.current) liveRobot.current.visible = live

    if (!live) {
      for (let i = 0; i < parts.length; i++) {
        const g = outer.current[i]
        if (!g) continue
        const part = parts[i]
        const tp = evalPart(part, g, p)
        const loose = 1 - tp
        if (loose > 0.001) {
          const s = part.seed
          const amp = 0.16 * loose
          g.position.x += Math.sin(t * 0.32 + s) * amp
          g.position.y += Math.sin(t * 0.24 + s * 2.3) * amp * 1.4
          g.position.z += Math.cos(t * 0.28 + s * 1.1) * amp * 0.7
        }
        /* each part clicks home with a tiny settle pulse: the build
           reads as a sequence of events, not one long slide */
        if (!seated.current[i] && tp >= 0.999) {
          seated.current[i] = true
          gsap
            .timeline()
            .to(g.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.08, ease: 'power2.in' })
            .to(g.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'elastic.out(1.8, 0.4)' })
        } else if (seated.current[i] && tp < 0.98) {
          seated.current[i] = false
        }
      }
    } else if (liveJoints.current) {
      /* the machine is alive. Reaching the end zone triggers the card
         performance once, on its own clock; leaving the zone reverses it
         a touch faster so the card is set back down out of frame. */
      const tl = cardTl.current
      if (tl) {
        const zone = session.cardPull > 0.2 ? true : session.cardPull < 0.08 ? false : inZone.current
        if (zone !== inZone.current) {
          inZone.current = zone
          if (zone) tl.timeScale(1).play()
          else tl.timeScale(1.5).reverse()
        }
      }
      /* idle drift dims while the arm is performing or holding, but never
         fully dies: the held card keeps breathing with the machine */
      const wake = smooth01((t - liveAt.current) / 3)
      const prog = tl ? tl.progress() : 0
      /* damp the drift while the show is running so the performance reads
         clean, then hand the machine back its own life once it is over */
      const perf = smooth01(prog / 0.12)
      const settled = smooth01((prog - 0.86) / 0.14)
      const drift = wake * (1 - 0.8 * perf * (1 - settled))
      /* The gripper works away on its own. Shaping the sine toward a
         squarer wave gives it a bit of bite: the jaw snaps between open
         and shut rather than drifting smoothly through the middle. */
      /* The gripper works away on its own. Driven by layered noise rather
         than a sine, so the rhythm never repeats and the timing between
         bites genuinely varies. Squaring a sine made it flick between two
         positions, which read as mechanical rather than idle, so this is
         a continuous signal again, a little slower, and it travels almost
         the jaw's whole range: the limits are -0.175 shut and 1.745 wide,
         and the previous offset never took it below 0.59, which is why
         the claw was only ever seen part-open. Smoothstepped so it dwells
         briefly at each end the way a hand does gripping and letting go. */
      const JAW_SHUT = -0.1
      const JAW_WIDE = 1.45
      const nz = fbm(t * 0.85, 12.3)
      const u = Math.min(1, Math.max(0, 0.5 + 0.72 * nz))
      const jawIdle = JAW_SHUT + (JAW_WIDE - JAW_SHUT) * (u * u * (3 - 2 * u))
      /* Once the card is delivered the machine looks around instead of
         staying pointed at what it put down: three sine rates that never
         line up, so the wandering has no obvious loop. The sum is
         normalised to -1..1 and then scaled, so the yaw is a bounded sway
         either side of the stance rather than an open-ended swing. At
         LOOK_MAX it turns about 22 degrees each way, nowhere near far
         enough to present its side to the camera or to reach back across
         the card sitting off to the left. */
      /* Measured, not guessed. Sweeping this offset and projecting the
         claw against the base shows the yaw runs the opposite way to what
         it looks like: raising it swings the claw LEFT, and the gripper
         points straight down the camera at about -0.41, moving roughly
         550px of screen per radian either side of that.

         Earlier versions biased "right" by going positive, which drove it
         further left every time, so the arm sat turned away and clipped
         behind the card. Centring on the measured forward angle with a
         small excursion keeps it facing front nearly all the time and
         only glancing off to either side. */
      const LOOK_FORWARD = -0.41
      const LOOK_SWAY = 0.2
      const wander =
        (0.55 * Math.sin(t * 0.13 + 0.4) +
          0.28 * Math.sin(t * 0.31 + 2.1) +
          0.14 * Math.sin(t * 0.73 + 4.3)) /
        0.97
      const look = settled * (LOOK_FORWARD + LOOK_SWAY * wander)
      for (const name of JOINT_NAMES) {
        /* amplitudes swell after the toss: the arm bends around casually
           instead of holding the tight pose it needed for the gesture */
        const amp = IDLE_AMP[name] + settled * (IDLE_LIVE[name] - IDLE_AMP[name])
        let v = gest[name] + amp * drift * fbm(t * IDLE_SPD[name] * Math.PI * 2, IDLE_SEED[name])
        /* the jaw is driven to its idle outright rather than nudged from
           the pose, which is what kept it stuck near the open end. It
           blends in with `settled`, so the performance still owns the jaw
           through the grab and the release. */
        if (name === 'Jaw') v = gest.Jaw + (jawIdle - gest.Jaw) * settled
        if (name === 'Rotation') v += look
        liveJoints.current[name]?.setJointValue(v)
      }
      session.gripHold = gest.grab01 > 0.5
      /* the release sits at 1.94s of the 3.5s performance */
      session.cardTossed = !!tl && tl.progress() > 0.56
    }

    /* unified breathing plus the closing reframe: during the pull the
       machine grows, settles down and slides right, so it reads big in
       the lower-right of the frame while it hoists the card. */
    if (root.current) {
      const unified = smooth01((p - 0.9) / 0.1)
      const pull = smooth01(session.cardPull)
      root.current.rotation.z = Math.sin(t * 0.5) * 0.008 * unified
      root.current.position.x = 1.7 + pull * 2.05
      root.current.position.y = -2.15 - pull * 0.45 + Math.sin(t * 0.8) * 0.02 * unified
      root.current.scale.setScalar(1 + pull * 0.46 + lockPulse.current.s)
    }

    /* Project the gripper's pinch point into CSS pixels. While the card
       is held (grab -> toss) the DOM card is pinned here by its top edge,
       so the claw reads as clamping the card's top; once tossed the card
       flies free and this is ignored. No 3D prop to clip into anything. */
    if (locked.current && root.current && liveRobot.current?.visible) {
      if (!jawLink.current) jawLink.current = liveRobot.current.getObjectByName('jaw') ?? null
      const link = jawLink.current
      if (link) {
        root.current.updateMatrixWorld(true)
        gripV.set(-0.05, 0.006, 0).applyMatrix4(link.matrixWorld).project(camera)
        session.grip.x = ((gripV.x + 1) / 2) * size.width
        session.grip.y = ((1 - gripV.y) / 2) * size.height
        session.grip.active = true
      }
    } else {
      session.grip.active = false
    }

    /* lock in once at 99.5 percent: pulse, ring, swap to the live robot */
    if (!locked.current && p > 0.995) {
      locked.current = true
      liveAt.current = t
      gsap
        .timeline()
        .to(lockPulse.current, { s: 0.02, duration: 0.09, ease: 'power2.in' })
        .to(lockPulse.current, { s: 0, duration: 0.5, ease: 'elastic.out(1.6, 0.35)' })
      if (ring.current) {
        const mat = ring.current.material as THREE.MeshBasicMaterial
        ring.current.scale.setScalar(0.2)
        mat.opacity = 0.9
        gsap.to(ring.current.scale, { x: 3.4, y: 3.4, z: 3.4, duration: 0.9, ease: 'power3.out' })
        gsap.to(mat, { opacity: 0, duration: 0.9, ease: 'power2.out' })
      }
    }
    if (locked.current && p < 0.96) {
      locked.current = false
      /* reset the live pose and the performance so the baked parts line
         up again and the show can play fresh next time */
      cardTl.current?.pause(0)
      Object.assign(gest, makeGesture())
      inZone.current = false
      session.gripHold = false
      session.cardTossed = false
      if (liveJoints.current)
        Object.entries(DISPLAY_POSE).forEach(([n, v]) => liveJoints.current![n]?.setJointValue(v))
    }
  })

  if (!parts) return null
  return (
    <group ref={root} position={[1.7, -2.15, 0]}>
      <group ref={partsGroup}>
        {parts.map((p, i) => (
          <group
            key={i}
            ref={(el) => {
              outer.current[i] = el
            }}
          >
            <mesh geometry={p.geom} material={p.mat} scale={ARM_SCALE} castShadow />
          </group>
        ))}
      </group>
      <mesh ref={ring} position={[0, 1.1, 0.4]}>
        <ringGeometry args={[0.96, 1, 48]} />
        <meshBasicMaterial color={'#6e8cff'} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
