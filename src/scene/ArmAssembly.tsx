/* ============================================================
   THE ASSEMBLY, continuous.

   The real SO-ARM101 parts hang exploded like an engineering
   diagram and build themselves as you scroll. Progress follows
   the scroll smoothly every frame; section tops are simply the
   marks the build passes through. Parts fly on arced paths with
   staggered windows so they never cross through each other, and
   when the build reaches 100 percent the machine locks in with
   a quick settle pulse, then breathes as one rigid body.
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
  servo: boolean
  aPos: THREE.Vector3
  aQuat: THREE.Quaternion
  ePos: THREE.Vector3
  eQuat: THREE.Quaternion
  /** arc waypoint between exploded and assembled */
  mPos: THREE.Vector3
  /** stagger window inside the master progress, base parts first */
  w0: number
  w1: number
  seed: number
}

/* display pose for the assembled arm, head level and alert */
const DISPLAY_POSE: Record<string, number> = {
  Rotation: 0.18,
  Pitch: -0.55,
  Elbow: -0.85,
  Wrist_Pitch: -0.45,
  Wrist_Roll: 0,
  Jaw: 0.25,
}

const ARM_SCALE = 7.2

const smooth01 = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1)
  return t * t * (3 - 2 * t)
}

export default function ArmAssembly() {
  const [parts, setParts] = useState<Part[] | null>(null)
  const outer = useRef<(THREE.Group | null)[]>([])
  const root = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const locked = useRef(false)
  const lockPulse = useRef({ s: 0 })

  /* ---- load URDF, bake transforms, plan the flight ---- */
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
      const joints = (robot as unknown as {
        joints: Record<string, { setJointValue: (v: number) => void }>
      }).joints
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
        if (src.includes('waveshare_mounting_plate')) return
        mesh.updateWorldMatrix(true, false)
        mesh.matrixWorld.decompose(tmpP, tmpQ, tmpS)
        collected.push({
          geom: mesh.geometry as THREE.BufferGeometry,
          servo: src.includes('sts3215'),
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

      /* exploded diagram cloud, up and to the right of where it will stand */
      const cloudCenter = centroid.clone().add(new THREE.Vector3(1.0, 1.8, 0.3))
      const axis = new THREE.Vector3()
      const planned: Part[] = collected.map((p, i) => {
        const dir = p.aPos.clone().sub(centroid)
        if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0)
        dir.normalize()
        const spread = 1.35 + (i % 5) * 0.38
        p.ePos
          .copy(cloudCenter)
          .addScaledVector(dir, spread)
          .add(
            new THREE.Vector3(
              Math.sin(p.seed) * 0.85,
              Math.cos(p.seed * 1.7) * 0.7,
              Math.sin(p.seed * 0.6) * 0.7,
            ),
          )
        axis.set(Math.sin(p.seed), Math.cos(p.seed * 2.1), Math.sin(p.seed * 1.3)).normalize()
        p.eQuat.copy(p.aQuat).multiply(new THREE.Quaternion().setFromAxisAngle(axis, 0.55 + (i % 3) * 0.3))
        /* arc waypoint: midpoint pushed outward and to the part's own side,
           so flight paths bow apart instead of crossing */
        const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 0, 1)).normalize()
        p.mPos
          .copy(p.ePos)
          .lerp(p.aPos, 0.5)
          .addScaledVector(dir, 0.7)
          .addScaledVector(side, Math.sin(p.seed * 3.1) * 0.5)
        return p as Part
      })

      /* base up build order: each part owns a window of the master progress,
         windows overlap a little so the build flows instead of ticking */
      const order = planned
        .map((p, i) => ({ i, y: p.aPos.y }))
        .sort((a, b) => a.y - b.y)
      const n = order.length
      order.forEach(({ i }, rank) => {
        const start = (rank / n) * 0.78
        planned[i].w0 = start
        planned[i].w1 = start + 0.34
      })

      setParts(planned)
    }
  }, [])

  /* quadratic bezier through the arc waypoint */
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

  /* ---- per frame: chase the scroll target, drift, breathe, lock ---- */
  useFrame(({ clock }, dt) => {
    if (!parts) return
    const k = 1 - Math.exp(-4.2 * dt)
    session.assembly += (session.assemblyTarget - session.assembly) * k
    const p = session.assembly
    const t = clock.elapsedTime

    for (let i = 0; i < parts.length; i++) {
      const g = outer.current[i]
      if (!g) continue
      const part = parts[i]
      const tp = evalPart(part, g, p)
      /* individual drift only while a part is still in flight or waiting.
         Fully placed parts sit EXACTLY on their assembled transform. */
      const loose = 1 - tp
      if (loose > 0.001) {
        const s = part.seed
        const amp = 0.16 * loose
        g.position.x += Math.sin(t * 0.32 + s) * amp
        g.position.y += Math.sin(t * 0.24 + s * 2.3) * amp * 1.4
        g.position.z += Math.cos(t * 0.28 + s * 1.1) * amp * 0.7
      }
    }

    /* the completed machine breathes as one rigid body */
    if (root.current) {
      const unified = smooth01((p - 0.9) / 0.1)
      root.current.rotation.z = Math.sin(t * 0.5) * 0.008 * unified
      root.current.position.y = -1.35 + Math.sin(t * 0.8) * 0.02 * unified
      /* lock pulse rides on top */
      const pulse = 1 + lockPulse.current.s
      root.current.scale.setScalar(pulse)
    }

    /* game style lock in: crossing 99.5 percent fires once */
    if (!locked.current && p > 0.995) {
      locked.current = true
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
    if (locked.current && p < 0.96) locked.current = false
  })

  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#dfe6f2',
        metalness: 0.5,
        roughness: 0.34,
        envMapIntensity: 0.9,
      }),
    [],
  )
  const servoMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#31406b',
        metalness: 0.85,
        roughness: 0.28,
        envMapIntensity: 1.3,
      }),
    [],
  )

  if (!parts) return null
  return (
    <group ref={root} position={[1.15, -1.35, 0]}>
      {parts.map((p, i) => (
        <group
          key={i}
          ref={(el) => {
            outer.current[i] = el
          }}
        >
          <mesh geometry={p.geom} material={p.servo ? servoMat : bodyMat} scale={ARM_SCALE} castShadow />
        </group>
      ))}
      {/* lock in confirmation ring, invisible until the build completes */}
      <mesh ref={ring} position={[0, 1.1, 0.4]}>
        <ringGeometry args={[0.96, 1, 48]} />
        <meshBasicMaterial color={'#6e8cff'} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
