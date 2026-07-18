/* Ambient dust. The push force follows the cursor's TRUE position:
   the pointer is unprojected onto each particle's own depth plane
   every frame, so the disturbance stays glued to the reticle no
   matter where the camera drifts. */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { session } from '../lib/session'

const COUNT = 420
const BOUNDS = { x: 16, y: 10, z: 8 }

export default function Dust() {
  const ref = useRef<THREE.Points>(null)
  const ndc = useMemo(() => new THREE.Vector3(), [])
  const world = useMemo(() => new THREE.Vector3(), [])
  const dirV = useMemo(() => new THREE.Vector3(), [])

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
        size: 0.024,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useFrame(({ clock, camera }) => {
    const p = ref.current
    if (!p) return
    const t = clock.elapsedTime
    const arr = (p.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array

    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i]
      let x = positions[i * 3] + Math.sin(t * 0.05 + s) * 0.6
      let y = positions[i * 3 + 1] + Math.sin(t * 0.04 + s * 2.1) * 0.5
      let z = positions[i * 3 + 2] + Math.cos(t * 0.045 + s * 1.3) * 0.4

      /* unproject the pointer onto THIS particle's depth plane */
      ndc.set(session.pointer.x, -session.pointer.y, 0.5)
      ndc.unproject(camera)
      dirV.copy(ndc).sub(camera.position).normalize()
      const dist = (z - camera.position.z) / dirV.z
      if (dist > 0) {
        world.copy(camera.position).addScaledVector(dirV, dist)
        const dx = x - world.x
        const dy = y - world.y
        const d2 = dx * dx + dy * dy
        if (d2 < 2.6) {
          const d = Math.sqrt(d2) || 0.001
          const f = (1 - d / 1.62) * 0.55
          if (f > 0) {
            x += (dx / d) * f
            y += (dy / d) * f
          }
        }
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
