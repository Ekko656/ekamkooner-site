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

/* ---- closing gesture keyframes ----
   REST is the finished stance itself (no snap when the pull begins), then
   the arm reaches down out of frame toward the left, grabs, and lifts the
   card up into place. Blended by session.cardPull: REST -> REACH -> LIFT. */
const CARD_REST = DISPLAY_POSE
const CARD_REACH: Record<string, number> = {
  Rotation: 0.95,
  Pitch: -1.2,
  Elbow: -0.3,
  Wrist_Pitch: 0.7,
  Wrist_Roll: 0,
  Jaw: 0.95,
}
const CARD_LIFT: Record<string, number> = {
  Rotation: 1.15,
  Pitch: -0.35,
  Elbow: -0.95,
  Wrist_Pitch: 0.1,
  Wrist_Roll: 0,
  Jaw: 0.18,
}
const lerpPose = (a: Record<string, number>, b: Record<string, number>, k: number) => {
  const out: Record<string, number> = {}
  for (const n of JOINT_NAMES) out[n] = a[n] + (b[n] - a[n]) * k
  return out
}
/* pose along the closing gesture for a given pull 0..1 */
const cardPose = (pull: number) => {
  if (pull <= 0.45) return lerpPose(CARD_REST, CARD_REACH, smooth01(pull / 0.45))
  return lerpPose(CARD_REACH, CARD_LIFT, smooth01((pull - 0.45) / 0.55))
}

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

  useFrame(({ clock }, dt) => {
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
      /* the machine is alive. Base pose eases from the woken display pose
         into the closing gesture as the card is pulled; idle drift fades
         out so the gesture reads clean. */
      const wake = smooth01((t - liveAt.current) / 3)
      const pull = session.cardPull
      const base = pull > 0.001 ? cardPose(pull) : DISPLAY_POSE
      const drift = (1 - smooth01(pull / 0.2)) * wake
      for (const name of JOINT_NAMES) {
        const v = base[name] + IDLE_AMP[name] * drift * fbm(t * IDLE_SPD[name] * Math.PI * 2, IDLE_SEED[name])
        liveJoints.current[name]?.setJointValue(v)
      }
    }

    /* unified breathing on the root, felt in both representations. As the
       card is pulled the whole rig eases down a touch so the lifted arm
       stays fully in frame. */
    if (root.current) {
      const unified = smooth01((p - 0.9) / 0.1)
      root.current.rotation.z = Math.sin(t * 0.5) * 0.008 * unified
      root.current.position.y = -2.15 - session.cardPull * 0.2 + Math.sin(t * 0.8) * 0.02 * unified
      root.current.scale.setScalar(1 + lockPulse.current.s)
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
      /* reset the live pose so the baked parts line up again */
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
