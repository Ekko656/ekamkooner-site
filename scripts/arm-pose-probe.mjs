/* Forward-kinematics probe for the SO-ARM101 display and card-gesture
   poses. Chain transcribed from public/so101/so101.urdf; world frame
   matches the site (rig.rotation.x = -PI/2, so URDF z is world y).
   Run: node scripts/arm-pose-probe.mjs */
import * as THREE from 'three'

const CHAIN = [
  ['Rotation',    [0.0207909,-0.0230745,0.0948817], [-3.14159,0,1.5708]],
  ['Pitch',       [-0.0303992,-0.0182778,-0.0542],  [-1.5708,-1.5708,0]],
  ['Elbow',       [-0.11257,-0.028,0],              [0,0,1.5708]],
  ['Wrist_Pitch', [-0.1349,0.0052,0],               [0,0,-1.5708]],
  ['Wrist_Roll',  [0,-0.0611,0.0181],               [1.5708,0,3.14159]],
  ['Jaw',         [0.0202,0.0188,-0.0234],          [1.5708,0,0]],
]
const TIP = new THREE.Vector3(-0.075, 0, 0) // claw tip in the jaw frame

function fk(q) {
  let M = new THREE.Matrix4()
  const out = {}
  for (const [name, xyz, r] of CHAIN) {
    const O = new THREE.Matrix4().compose(
      new THREE.Vector3(...xyz),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0], r[1], r[2], 'ZYX')),
      new THREE.Vector3(1, 1, 1))
    M = M.clone().multiply(O).multiply(new THREE.Matrix4().makeRotationZ(q[name] ?? 0))
    out[name] = M.clone()
  }
  return out
}
const toWorld = v => new THREE.Vector3(v.x, v.z, -v.y)
const posOf = m => new THREE.Vector3().setFromMatrixPosition(m)

export function show(q, label) {
  const F = fk(q)
  const elbow = toWorld(posOf(F.Elbow))
  const tip = toWorld(TIP.clone().applyMatrix4(F.Jaw))
  console.log(`--- ${label}`)
  console.log(`   elbow y=${elbow.y.toFixed(3)} z=${elbow.z.toFixed(3)} | tip y=${tip.y.toFixed(3)} z=${tip.z.toFixed(3)}`)
  console.log(`   tip below elbow: ${tip.y < elbow.y} | tip toward camera: ${tip.z > elbow.z}`)
}

show({Rotation:0.8,Pitch:0.5,Elbow:-0.71,Wrist_Pitch:1.34,Wrist_Roll:0,Jaw:0.62}, 'DISPLAY (rest)')
show({Rotation:0.85,Pitch:1.15,Elbow:-0.6,Wrist_Pitch:1.5,Wrist_Roll:0,Jaw:1.2},  'REACH candidate')
show({Rotation:0.85,Pitch:-0.2,Elbow:-1.05,Wrist_Pitch:0.9,Wrist_Roll:0,Jaw:0.3}, 'LIFT candidate')
