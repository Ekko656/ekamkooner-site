/* ============================================================
   The permanent canvas — fixed behind the DOM for the entire
   session. Camera drifts with the pointer (parallax, 2D-safe)
   and reframes per section checkpoint with the heavy ease.
   ============================================================ */
import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { session, type SectionId } from '../lib/session'
import { MECH_HEAVY } from '../lib/eases'
import ArmAssembly from './ArmAssembly'
import Dust from './Dust'

/* per-section camera framing: [pos], [lookAt] */
const FRAMES: Record<SectionId, { pos: [number, number, number]; look: [number, number, number] }> = {
  hero: { pos: [0, 0.2, 9.4], look: [0.9, -0.2, 0] },
  directive: { pos: [-1.6, 0.5, 8.6], look: [1.4, -0.4, 0] },
  systems: { pos: [2.2, 0.9, 7.6], look: [1.1, -0.5, 0] },
  operator: { pos: [-0.8, 1.4, 7.2], look: [1.2, -0.3, 0] },
  uplink: { pos: [0, 0.4, 6.4], look: [1.15, -0.35, 0] },
}

function CameraRig() {
  const { camera } = useThree()
  const base = useRef({ ...FRAMES.hero })
  const look = useRef(new THREE.Vector3(...FRAMES.hero.look))

  useEffect(() => {
    const off = session.onSection((id) => {
      const f = FRAMES[id]
      gsap.to(base.current.pos, { 0: f.pos[0], 1: f.pos[1], 2: f.pos[2], duration: 2.1, ease: MECH_HEAVY, overwrite: true })
      gsap.to(look.current, { x: f.look[0], y: f.look[1], z: f.look[2], duration: 2.1, ease: MECH_HEAVY, overwrite: true })
    })
    return () => {
      off()
    }
  }, [])

  useFrame(() => {
    /* pointer parallax on top of the section frame — subtle, weighted */
    const px = session.pointer.x
    const py = session.pointer.y
    camera.position.x += (base.current.pos[0] + px * 0.45 - camera.position.x) * 0.045
    camera.position.y += (base.current.pos[1] - py * 0.3 - camera.position.y) * 0.045
    camera.position.z += (base.current.pos[2] - camera.position.z) * 0.045
    camera.lookAt(look.current)
  })
  return null
}

export default function Stage() {
  return (
    <div className="layer-canvas">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        camera={{ position: FRAMES.hero.pos, fov: 38, near: 0.1, far: 60 }}
      >
        {/* pool-of-light atmosphere: cool key, faint signal rim, low ambient */}
        <ambientLight intensity={0.32} color={'#c8d4f0'} />
        <directionalLight position={[4, 6, 7]} intensity={1.35} color={'#f2f5ff'} />
        <directionalLight position={[-6, 2, -4]} intensity={0.5} color={'#6e8cff'} />
        <pointLight position={[1.2, -0.5, 3]} intensity={0.55} distance={12} decay={2} color={'#8fa5e8'} />
        <Suspense fallback={null}>
          <ArmAssembly />
        </Suspense>
        <Dust />
        <CameraRig />
        {/* radial vignette glow behind the machine */}
        <mesh position={[1.1, -0.4, -6]}>
          <circleGeometry args={[9, 48]} />
          <meshBasicMaterial color={'#10162a'} transparent opacity={0.85} />
        </mesh>
      </Canvas>
    </div>
  )
}
