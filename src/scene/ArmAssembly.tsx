/* ============================================================
   THE ASSEMBLY — the site's living centerpiece.

   The real SO-ARM101 (13 STL parts, true URDF transforms) floats
   exploded like an engineering diagram, and assembles itself as
   the visitor descends the page. Section checkpoints tween the
   progress of ONE master timeline (event-driven trajectories —
   machines move deliberately, they don't scrub).

   Each part: outer group = timeline-owned transform,
              inner group = idle float/breathing (never fights GSAP).
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import URDFLoader from 'urdf-loader'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { session, ASSEMBLY_TARGET, type SectionId } from '../lib/session'
import { MECH_HEAVY } from '../lib/eases'

type Part = {
  geom: THREE.BufferGeometry
  servo: boolean
  /** assembled pose (from URDF world transforms) */
  aPos: THREE.Vector3
  aQuat: THREE.Quaternion
  /** exploded pose */
  ePos: THREE.Vector3
  eQuat: THREE.Quaternion
  /** float character */
  seed: number
}

/* display pose for the assembled arm — head level, alert (verified joint map
   from the portfolio-3d work: Rotation/Pitch/Elbow/Wrist_Pitch/Wrist_Roll/Jaw) */
const DISPLAY_POSE: Record<string, number> = {
  Rotation: 0.18,
  Pitch: -0.55,
  Elbow: -0.85,
  Wrist_Pitch: -0.45,
  Wrist_Roll: 0,
  Jaw: 0.25,
}

const ARM_SCALE = 7.2

export default function ArmAssembly() {
  const [parts, setParts] = useState<Part[] | null>(null)
  const outer = useRef<(THREE.Group | null)[]>([])
  const inner = useRef<(THREE.Group | null)[]>([])
  const tl = useRef<gsap.core.Timeline | null>(null)
  const prog = useRef({ v: 0 })

  /* ---- load URDF, bake part transforms, compute the explosion ---- */
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
      /* pose the robot, then bake every mesh's world transform */
      const joints = (robot as unknown as {
        joints: Record<string, { setJointValue: (v: number) => void }>
      }).joints
      Object.entries(DISPLAY_POSE).forEach(([n, v]) => joints[n]?.setJointValue(v))

      /* URDF is z-up: rotate the whole rig like the garage scene did */
      const rig = new THREE.Group()
      rig.rotation.x = -Math.PI / 2
      rig.add(robot)
      rig.updateMatrixWorld(true)

      const collected: Part[] = []
      const centroid = new THREE.Vector3()
      const tmpP = new THREE.Vector3()
      const tmpQ = new THREE.Quaternion()
      const tmpS = new THREE.Vector3()

      robot.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (!mesh.isMesh) return
        const src = String(mesh.userData.src ?? '')
        if (src.includes('waveshare_mounting_plate')) return // wide plate: not part of the machine's silhouette
        mesh.updateWorldMatrix(true, false)
        mesh.matrixWorld.decompose(tmpP, tmpQ, tmpS)
        collected.push({
          geom: mesh.geometry as THREE.BufferGeometry,
          servo: src.includes('sts3215'),
          aPos: tmpP.clone().multiplyScalar(ARM_SCALE),
          aQuat: tmpQ.clone(),
          ePos: new THREE.Vector3(),
          eQuat: new THREE.Quaternion(),
          seed: Math.random() * 100,
        })
        centroid.add(collected[collected.length - 1].aPos)
      })
      centroid.divideScalar(collected.length)

      /* structured explosion: the diagram cloud hangs up-right of where the
         machine will stand, each part pushed out along its centroid ray with
         a deliberate per-part twist. Reads as a diagram, not debris. */
      const cloudCenter = centroid.clone().add(new THREE.Vector3(1.1, 2.5, 0.3))
      const axis = new THREE.Vector3()
      collected.forEach((p, i) => {
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
      })

      setParts(collected)
    }
  }, [])

  /* ---- master assembly timeline + section-checkpoint trajectories ---- */
  useEffect(() => {
    if (!parts) return
    const t = gsap.timeline({ paused: true })
    /* base-up build order: sort by assembled height so the machine grows */
    const order = parts
      .map((p, i) => ({ i, y: p.aPos.y }))
      .sort((a, b) => a.y - b.y)
    order.forEach(({ i }, rank) => {
      const g = outer.current[i]
      if (!g) return
      const p = parts[i]
      const at = (rank / order.length) * 0.7 // staggered along the master
      t.to(g.position, { x: p.aPos.x, y: p.aPos.y, z: p.aPos.z, duration: 0.3, ease: 'none' }, at)
      const q = { t: 0 }
      t.to(
        q,
        {
          t: 1,
          duration: 0.3,
          ease: 'none',
          onUpdate: () => g.quaternion.slerpQuaternions(p.eQuat, p.aQuat, q.t),
        },
        at,
      )
    })
    tl.current = t
    t.progress(0.0001).progress(0)

    /* section change → tween the timeline's progress (the trajectory) */
    const off = session.onSection((id: SectionId) => {
      gsap.to(prog.current, {
        v: ASSEMBLY_TARGET[id],
        duration: 1.9,
        ease: MECH_HEAVY,
        overwrite: true,
        onUpdate: () => {
          tl.current?.progress(prog.current.v)
          session.assembly = prog.current.v
        },
      })
    })
    return () => {
      off()
      t.kill()
    }
  }, [parts])

  /* ---- idle life: exploded parts drift; assembled arm breathes ---- */
  useFrame(({ clock }) => {
    if (!parts) return
    const t = clock.elapsedTime
    const settle = 1 - session.assembly // 1 = fully exploded
    for (let i = 0; i < parts.length; i++) {
      const g = inner.current[i]
      if (!g) continue
      const s = parts[i].seed
      const amp = 0.06 + settle * 0.22
      g.position.set(
        Math.sin(t * 0.32 + s) * amp,
        Math.sin(t * 0.24 + s * 2.3) * amp * 1.4,
        Math.cos(t * 0.28 + s * 1.1) * amp * 0.7,
      )
      g.rotation.z = Math.sin(t * 0.18 + s) * 0.02 * (0.3 + settle)
    }
  })

  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#dfe6f2',
        metalness: 0.42,
        roughness: 0.38,
      }),
    [],
  )
  const servoMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#151b2c',
        metalness: 0.75,
        roughness: 0.35,
      }),
    [],
  )

  if (!parts) return null
  return (
    <group position={[1.15, -1.35, 0]}>
      {parts.map((p, i) => (
        <group
          key={i}
          ref={(el) => {
            outer.current[i] = el
          }}
          position={p.ePos}
          quaternion={p.eQuat}
        >
          <group
            ref={(el) => {
              inner.current[i] = el
            }}
          >
            <mesh geometry={p.geom} material={p.servo ? servoMat : bodyMat} scale={ARM_SCALE} castShadow />
          </group>
        </group>
      ))}
    </group>
  )
}
