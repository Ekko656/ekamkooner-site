/* ============================================================
   The permanent canvas. On About, the camera rides a smooth
   orbit path scrubbed by scroll, swinging around the machine so
   it swaps sides of the screen and is never under the text. On
   every other page the stage holds a calm wide frame with dust,
   stars and glow keeping the navy alive.
   ============================================================ */
import { Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { session } from '../lib/session'
import ArmAssembly from './ArmAssembly'
import Dust from './Dust'

/* ---- About camera rig ----
   The machine always takes the half of the screen the text is not on.
   Measured beat centres (page progress): text is LEFT through 0.27,
   RIGHT from 0.28 to 0.59, LEFT again from 0.60 to 0.80. Camera keys
   are in orbit time (orbitT = progress / 0.8), so those boundaries land
   at orbitT 0.34 and 0.74.

   Framing is polar around the machine rather than absolute positions,
   which is what lets the two side swaps have different character:
     theta  - azimuth around the machine. Changing it ORBITS.
     lat    - lateral truck applied to camera and look target together.
              Changing it alone SLIDES the machine across frame with no
              rotation. Negative lat puts the machine screen-right.
   First swap (orbitT .34 -> .46) turns theta: a rotation around the
   machine. Second swap (orbitT .74 -> .86) holds theta and moves lat
   only: a clean horizontal slide back to the right. */
const ARM_CENTER = new THREE.Vector3(1.7, -0.3, 0)
/* How far off centre the machine sits, per side. Right phase: half the
   visible width at r 8.9+ is about 4.9 units, so 3.0 clears the text
   with the cloud's 1.8 spread still fully on screen. Left phase runs
   closer (r 8.5-8.7, half width about 4.7), and 3.0 was pushing the
   machine's far edge off the frame - 2.45 keeps it clear of the copy
   AND entirely on screen. */
const LAT_R = 3.0
/* the left phase sits closer to centre: the copy there is held to two
   balanced lines, so the machine does not need to be pushed as far over,
   and at 2.3 the outer parts of the exploded cloud ran off the frame */
const LAT_L = 0.72
/* Swaps are timed to the measured beat centres, converted to orbit time
   (orbitT = progress / 0.82). Measured centres: copy sits left through
   progress .197, right from .352 to .556, left again from .711 to .814.
   Each swap runs through the empty gap between those runs, so the
   machine crosses the frame while neither block is mid-screen.
   The two swaps are deliberately different moves: the first ORBITS the
   machine (theta sweeps a full radian while the lateral offset flips),
   the second holds theta and trucks sideways - a plain slide. */
type Key = { t: number; theta: number; r: number; y: number; lat: number }
const KEYS: Key[] = [
  { t: 0.0, theta: -0.1, r: 9.6, y: 1.15, lat: -LAT_R },
  { t: 0.28, theta: -0.08, r: 8.9, y: 1.0, lat: -LAT_R },
  /* rotate: theta swings the camera around to the machine's far side */
  /* a touch closer through the rotation: the copy on the right is held
     to two balanced lines there, which frees the left half for a larger
     read of the machine */
  { t: 0.41, theta: 0.9, r: 8.15, y: 0.85, lat: LAT_L },
  { t: 0.73, theta: 0.92, r: 8.05, y: 0.7, lat: LAT_L },
  /* slide: theta held, lateral truck only, done before the left-hand
     copy arrives */
  { t: 0.84, theta: 0.92, r: 8.2, y: 0.55, lat: -LAT_R },
  { t: 1.0, theta: 0.9, r: 8.0, y: 0.35, lat: -LAT_R },
]
const IDLE_FRAME = { pos: new THREE.Vector3(0, 0.3, 9.6), look: new THREE.Vector3(0.6, 0.1, 0) }
/* closing frame: square in front of the finished arm (root x = 1.7), which
   sits in the right third so the pulled card has room on the left */
/* pulled back so the whole machine reads on the right of the closing
   frame, leaving the left half open for the placard the arm sets down */
const END_POS = new THREE.Vector3(1.1, 0.3, 9.8)
const END_LOOK = new THREE.Vector3(1.15, -0.25, 0)
const ss = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1)
  return t * t * (3 - 2 * t)
}

/* sample the keyframes at orbit time, smoothstepped between neighbours */
function sampleKeys(t: number): Key {
  let a = KEYS[0]
  let b = KEYS[KEYS.length - 1]
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (t >= KEYS[i].t && t <= KEYS[i + 1].t) {
      a = KEYS[i]
      b = KEYS[i + 1]
      break
    }
  }
  if (t <= KEYS[0].t) return KEYS[0]
  if (t >= b.t && b === KEYS[KEYS.length - 1] && t >= KEYS[KEYS.length - 1].t) return KEYS[KEYS.length - 1]
  const k = ss((t - a.t) / Math.max(1e-6, b.t - a.t))
  return {
    t,
    theta: a.theta + (b.theta - a.theta) * k,
    r: a.r + (b.r - a.r) * k,
    y: a.y + (b.y - a.y) * k,
    lat: a.lat + (b.lat - a.lat) * k,
  }
}

function CameraRig() {
  const cur = useMemo(() => ({ pos: IDLE_FRAME.pos.clone(), look: IDLE_FRAME.look.clone() }), [])
  const target = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3() }), [])

  useFrame(({ camera }, dt) => {
    if (session.armVisible) {
      /* the orbit tells the build story and finishes with the assembly at
         82% of the page; the last stretch settles into the closing frame */
      const ap = Math.min(Math.max(session.aboutProgress, 0), 1)
      const orbitT = Math.min(ap / 0.82, 1)
      const key = sampleKeys(orbitT)
      const sin = Math.sin(key.theta)
      const cos = Math.cos(key.theta)
      /* camera sits back along the azimuth; lat trucks camera and look
         target together so the machine slides without turning */
      target.pos.set(
        ARM_CENTER.x + sin * key.r + cos * key.lat,
        ARM_CENTER.y + key.y,
        ARM_CENTER.z + cos * key.r - sin * key.lat,
      )
      target.look.set(ARM_CENTER.x + cos * key.lat, ARM_CENTER.y, ARM_CENTER.z - sin * key.lat)
      const pull = ss(session.cardPull)
      if (pull > 0) {
        target.pos.lerp(END_POS, pull)
        target.look.lerp(END_LOOK, pull)
      }
    } else {
      target.pos.copy(IDLE_FRAME.pos)
      target.look.copy(IDLE_FRAME.look)
    }
    const k = 1 - Math.exp(-4.5 * dt)
    cur.pos.lerp(target.pos, k)
    cur.look.lerp(target.look, k)
    /* the pointer parallax settles to nothing during the closing gesture */
    const par = 1 - ss(session.cardPull)
    camera.position.set(
      cur.pos.x + session.pointer.x * 0.4 * par,
      cur.pos.y - session.pointer.y * 0.28 * par,
      cur.pos.z,
    )
    camera.lookAt(cur.look)
  })
  return null
}

function Glow() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 256
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    /* a restrained cool pool, dimmer and less saturated so the ground
       reads near-black and the robot's own reflections carry the scene */
    g.addColorStop(0, 'rgba(26, 36, 70, 0.34)')
    g.addColorStop(0.45, 'rgba(14, 20, 42, 0.16)')
    g.addColorStop(1, 'rgba(5, 8, 15, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  /* sit the pool up and to the right, where the key light hits the robot */
  return (
    <mesh position={[2.4, 0.6, -5]}>
      <planeGeometry args={[22, 16]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  )
}

/* two star layers: a mid field and a far dim field, both drifting very
   slowly so the background is never a dead poster */
function Starfield({ count, depth, size, opacity, speed }: { count: number; depth: [number, number]; size: number; opacity: number; speed: number }) {
  const ref = useMemo(() => ({ points: null as THREE.Object3D | null }), [])
  const geom = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 52
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30
      pos[i * 3 + 2] = depth[0] - Math.random() * (depth[1] - depth[0]) * -1
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [count, depth])
  useFrame(({ clock }) => {
    if (ref.points) ref.points.rotation.z = Math.sin(clock.elapsedTime * 0.008 * speed) * 0.02 * speed
  })
  return (
    <points
      geometry={geom}
      ref={(p) => {
        ref.points = p
      }}
    >
      <pointsMaterial color={'#9daccf'} size={size} sizeAttenuation transparent opacity={opacity} depthWrite={false} />
    </points>
  )
}

export default function Stage({ showArm }: { showArm: boolean }) {
  session.armVisible = showArm
  return (
    <div className="layer-canvas">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        camera={{ position: IDLE_FRAME.pos.toArray(), fov: 38, near: 0.1, far: 60 }}
      >
        <ambientLight intensity={0.34} color={'#c2cee8'} />
        <hemisphereLight intensity={0.3} color={'#d6e0f5'} groundColor={'#05070d'} />
        <directionalLight position={[4, 6, 7]} intensity={1.5} color={'#f4f7ff'} />
        <directionalLight position={[-6, 2, -4]} intensity={0.32} color={'#6e8cff'} />
        <directionalLight position={[0, -1, 8]} intensity={0.24} color={'#9fb2e8'} />
        <Environment resolution={128}>
          <Lightformer intensity={1.1} position={[-4, 3, 4]} scale={[7, 5, 1]} color={'#e8eeff'} />
          <Lightformer intensity={0.5} position={[5, 1, -3]} scale={[5, 4, 1]} color={'#6e8cff'} />
          <Lightformer intensity={0.7} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 8, 1]} color={'#cfd9f4'} />
        </Environment>
        {showArm && (
          <Suspense fallback={null}>
            <ArmAssembly />
          </Suspense>
        )}
        <Dust />
        <Starfield count={620} depth={[-7, -12]} size={0.028} opacity={0.32} speed={1} />
        <Starfield count={420} depth={[-13, -20]} size={0.04} opacity={0.18} speed={0.5} />
        <Glow />
        <CameraRig />
      </Canvas>
    </div>
  )
}
