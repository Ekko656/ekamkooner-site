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

/* About orbit: camera swings from the machine's left side around to its
   right and back in, so the machine reads right, then left, then close */
const PATH = {
  pos: [
    new THREE.Vector3(-0.2, 0.8, 11.6),
    new THREE.Vector3(1.4, 0.95, 9.4),
    new THREE.Vector3(4.2, 0.75, 7.4),
    new THREE.Vector3(-0.9, 0.55, 7.9),
    new THREE.Vector3(0.75, 0.15, 7.5),
  ],
  look: [
    new THREE.Vector3(1.6, 0.25, 0),
    new THREE.Vector3(1.5, 0.0, 0),
    new THREE.Vector3(2.7, -0.4, 0),
    new THREE.Vector3(0.72, -0.42, 0),
    new THREE.Vector3(0.85, -0.5, 0),
  ],
}
const IDLE_FRAME = { pos: new THREE.Vector3(0, 0.3, 9.6), look: new THREE.Vector3(0.6, 0.1, 0) }
/* closing frame: square in front of the finished arm (root x = 1.7), which
   sits in the right third so the pulled card has room on the left */
const END_POS = new THREE.Vector3(0.85, 0.05, 6.9)
const END_LOOK = new THREE.Vector3(0.9, -0.55, 0)
const ss = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1)
  return t * t * (3 - 2 * t)
}

function CameraRig() {
  const posCurve = useMemo(() => new THREE.CatmullRomCurve3(PATH.pos, false, 'centripetal'), [])
  const lookCurve = useMemo(() => new THREE.CatmullRomCurve3(PATH.look, false, 'centripetal'), [])
  const cur = useMemo(() => ({ pos: IDLE_FRAME.pos.clone(), look: IDLE_FRAME.look.clone() }), [])
  const target = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3() }), [])

  useFrame(({ camera }, dt) => {
    if (session.armVisible) {
      /* the orbit tells the build story and finishes by 80% of the page;
         the last stretch settles into the closing front frame */
      const ap = Math.min(Math.max(session.aboutProgress, 0), 1)
      const orbitT = Math.min(ap / 0.8, 1)
      posCurve.getPoint(orbitT, target.pos)
      lookCurve.getPoint(orbitT, target.look)
      const pull = ss(session.cardPull)
      if (pull > 0) {
        target.pos.lerp(END_POS, pull)
        target.look.lerp(END_LOOK, pull)
      }
    } else {
      target.pos.copy(IDLE_FRAME.pos)
      target.look.copy(IDLE_FRAME.look)
    }
    const k = 1 - Math.exp(-3.2 * dt)
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
  const ref = useMemo(() => ({ points: null as THREE.Points | null }), [])
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
