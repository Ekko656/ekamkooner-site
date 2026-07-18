/* Ambient dust — the navy is never dead. A few hundred slow ice-white
   points drifting with depth attenuation; the cursor pushes them faintly. */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { session } from '../lib/session'

const COUNT = 420
const BOUNDS = { x: 16, y: 10, z: 8 }

export default function Dust() {
  const ref = useRef<THREE.Points>(null)

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const seeds = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * BOUNDS.x
      positions[i * 3 + 1] = (Math.random() - 0.5) * BOUNDS.y
      positions[i * 3 + 2] = (Math.random() - 0.5) * BOUNDS.z
      seeds[i] = Math.random() * 100
    }
    return { positions, seeds }
  }, [])

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#aebadb',
        size: 0.02,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useFrame(({ clock }) => {
    const p = ref.current
    if (!p) return
    const t = clock.elapsedTime
    const arr = (p.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array
    const px = session.pointer.x * 6
    const py = session.pointer.y * 4
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i]
      let x = positions[i * 3] + Math.sin(t * 0.05 + s) * 0.6
      let y = positions[i * 3 + 1] + Math.sin(t * 0.04 + s * 2.1) * 0.5 + ((t * 0.02 + s) % BOUNDS.y) * 0.001
      const z = positions[i * 3 + 2] + Math.cos(t * 0.045 + s * 1.3) * 0.4
      /* faint cursor push */
      const dx = x - px
      const dy = y - py
      const d2 = dx * dx + dy * dy
      if (d2 < 4) {
        const f = (1 - d2 / 4) * 0.35
        x += dx * f
        y += dy * f
      }
      arr[i * 3] = x
      arr[i * 3 + 1] = y
      arr[i * 3 + 2] = z
    }
    ;(p.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
  })

  return (
    <points ref={ref} material={mat}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions.slice(), 3]} />
      </bufferGeometry>
    </points>
  )
}
