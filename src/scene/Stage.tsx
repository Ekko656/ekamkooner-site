/* ============================================================
   The permanent canvas behind the DOM. Camera drifts with the
   pointer and reframes gently per section. Lightformer
   environment gives the metal real reflections, a radial glow
   pools light behind the machine, and a far starfield gives the
   navy depth.
   ============================================================ */
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { session, type SectionId } from '../lib/session'
import { MECH_HEAVY } from '../lib/eases'
import ArmAssembly from './ArmAssembly'
import Dust from './Dust'

const FRAMES: Record<SectionId, { pos: [number, number, number]; look: [number, number, number] }> = {
  hero: { pos: [0, 0.2, 9.8], look: [0.9, 0.1, 0] },
  why: { pos: [-1.7, 0.5, 8.8], look: [0.85, -0.3, 0] },
  projects: { pos: [-2.0, 0.7, 8.4], look: [0.55, -0.4, 0] },
  about: { pos: [-1.2, 0.9, 8.2], look: [0.7, -0.35, 0] },
  contact: { pos: [-0.6, 0.35, 8.8], look: [0.75, -0.3, 0] },
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
  }, [camera])

  useFrame(() => {
    const px = session.pointer.x
    const py = session.pointer.y
    camera.position.x += (base.current.pos[0] + px * 0.45 - camera.position.x) * 0.045
    camera.position.y += (base.current.pos[1] - py * 0.3 - camera.position.y) * 0.045
    camera.position.z += (base.current.pos[2] - camera.position.z) * 0.045
    camera.lookAt(look.current)
  })
  return null
}

/* soft radial pool of light behind the machine, from a generated gradient */
function Glow() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 256
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    g.addColorStop(0, 'rgba(38, 52, 110, 0.55)')
    g.addColorStop(0.45, 'rgba(22, 30, 64, 0.28)')
    g.addColorStop(1, 'rgba(10, 14, 26, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  return (
    <mesh position={[1.2, -0.2, -5]}>
      <planeGeometry args={[22, 16]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  )
}

/* far starfield: tiny static points way behind everything, parallax comes
   free from the camera drift */
function Starfield() {
  const geom = useMemo(() => {
    const N = 700
    const pos = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 46
      pos[i * 3 + 1] = (Math.random() - 0.5) * 26
      pos[i * 3 + 2] = -8 - Math.random() * 10
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  return (
    <points geometry={geom}>
      <pointsMaterial color={'#8fa0c8'} size={0.016} sizeAttenuation transparent opacity={0.4} depthWrite={false} />
    </points>
  )
}

export default function Stage() {
  return (
    <div className="layer-canvas">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        camera={{ position: FRAMES.hero.pos, fov: 38, near: 0.1, far: 60 }}
      >
        <ambientLight intensity={0.4} color={'#c8d4f0'} />
        <hemisphereLight intensity={0.35} color={'#dfe8ff'} groundColor={'#0a0e1a'} />
        <directionalLight position={[4, 6, 7]} intensity={1.45} color={'#f2f5ff'} />
        <directionalLight position={[-6, 2, -4]} intensity={0.55} color={'#6e8cff'} />
        <directionalLight position={[0, -1, 8]} intensity={0.3} color={'#9fb2e8'} />
        {/* studio style reflection environment, no network fetch */}
        <Environment resolution={128}>
          <Lightformer intensity={1.1} position={[-4, 3, 4]} scale={[7, 5, 1]} color={'#e8eeff'} />
          <Lightformer intensity={0.5} position={[5, 1, -3]} scale={[5, 4, 1]} color={'#6e8cff'} />
          <Lightformer intensity={0.7} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 8, 1]} color={'#cfd9f4'} />
        </Environment>
        <Suspense fallback={null}>
          <ArmAssembly />
        </Suspense>
        <Dust />
        <Starfield />
        <Glow />
        <CameraRig />
      </Canvas>
    </div>
  )
}
