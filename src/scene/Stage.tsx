/* ============================================================
   The permanent canvas. On About, the camera rides a smooth
   orbit path scrubbed by scroll, swinging around the machine so
   it swaps sides of the screen and is never under the text. On
   every other page the stage holds a calm wide frame with dust,
   stars and glow keeping the navy alive.
   ============================================================ */
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { session } from '../lib/session'
import { perf, onTier } from '../lib/perf'
import ArmAssembly from './ArmAssembly'

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

/* Under `frameloop="demand"` the scene is only drawn when something asks
   for it. The single automatic draw at mount happens before the pieces
   that make the frame worth looking at exist - the environment map is
   still rendering to its target, the star geometry is still being built -
   so the canvas comes up empty and stays that way. Ask for a few frames
   over the first second, then stop. */
function PaintOnSettle() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const at = [0, 60, 200, 500, 1000]
    const ids = at.map((ms) => window.setTimeout(invalidate, ms))
    return () => ids.forEach(clearTimeout)
  }, [invalidate])
  return null
}

/* No ground, deliberately.

   A contact shadow was tried here and removed. The machine on this
   page is being assembled in mid-air out of parts that are still
   flying into place — it has no floor to cast onto, and the soft
   ellipse that stood in for one read as a grey smudge across the
   lower half of the paper. The parts carry their own form from the
   lighting; the page stays clean sheet. */

export default function Stage({ showArm }: { showArm: boolean }) {
  session.armVisible = showArm
  const [tier, setTier] = useState(perf.tier)
  useEffect(() => {
    const off = onTier(setTier)
    return () => {
      off()
    }
  }, [])
  /* Make the canvas take its real size.

     r3f sizes itself from a ResizeObserver on its container, and on a
     fresh load that measurement never lands: the canvas is left at the
     bare <canvas> default of 300x150 while CSS stretches it across the
     whole viewport. The machine was being rendered at 300x150 and blown
     up to 3000px wide — that is the "why does it look like 360p", and
     it was in fact far worse than 360p.

     A single window resize event snaps it to full size. It cannot be
     fired from inside <Canvas>, because with no root none of its
     children ever mount — which is exactly why this hook lives out
     here, in the component that does. Fired next frame and again once
     layout has settled, in case fonts or a scrollbar move things.

     This is also the real cause of the long-standing note in PLAN.md
     about the stage canvas "never initialising" in the preview pane.
     That was never a pane quirk: it happens in every browser, and it
     was only ever masked by anything that happened to fire a resize. */
  useEffect(() => {
    const fire = () => window.dispatchEvent(new Event('resize'))
    const raf = requestAnimationFrame(fire)
    const id = window.setTimeout(fire, 250)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(id)
    }
  }, [])

  const low = tier === 'low'

  /* No context, no stage. A machine that cannot give us WebGL would
     otherwise get a dead canvas element and a console full of warnings;
     the navy ground and the DOM layers carry the page on their own. */
  if (!perf.webgl) return null

  return (
    <div className="layer-canvas">
      <Canvas
        /* a software rasteriser pays for every pixel it fills, and at
           dpr 2 that is four times the work for the same frame */
        /* An explicit number, not a [min, max] range. Given a range r3f
           settled on the MINIMUM here, so a retina screen was rendering
           the machine at half resolution — the other half of why it
           looked soft. */
        dpr={low ? 1 : Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2)}
        /* Off About the scene is background only: drifting dust, stars,
           a glow pool. On the low tier that is not worth sixty renders a
           second, so it is drawn once and left. About keeps a live loop
           either way - the machine building itself IS the page. */
        frameloop={low && !showArm ? 'demand' : 'always'}
        gl={{ antialias: !low, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        camera={{ position: IDLE_FRAME.pos.toArray(), fov: 38, near: 0.1, far: 60 }}
      >
        {/* Daylight on paper. The scene used to be lit cold and blue to
            sit in a navy void; on a white sheet the machine has to be
            lit the way an object on a desk is lit — a bright key from
            the front left, a soft bounce off the paper from below, and
            an overhead softbox for the length of the highlights.

            One light is not white: a low, cool purple from behind,
            which is where the site's accent shows up in the metal. It
            is a rim, not a colour cast. */}
        <ambientLight intensity={0.55} color={'#ffffff'} />
        <hemisphereLight intensity={0.6} color={'#ffffff'} groundColor={'#e6e2da'} />
        <directionalLight position={[4, 6, 7]} intensity={1.35} color={'#ffffff'} />
        <directionalLight position={[-6, 2, -4]} intensity={0.45} color={'#b9a8e0'} />
        <directionalLight position={[0, -2, 6]} intensity={0.3} color={'#fffaf2'} />
        <Environment resolution={low ? 32 : 128}>
          <Lightformer intensity={1.4} position={[-4, 3, 4]} scale={[7, 5, 1]} color={'#ffffff'} />
          <Lightformer intensity={0.9} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[9, 9, 1]} color={'#ffffff'} />
          {/* the paper itself, bouncing back up into the underside */}
          <Lightformer intensity={0.55} position={[0, -5, 1]} rotation={[-Math.PI / 2, 0, 0]} scale={[9, 9, 1]} color={'#f2efe9'} />
          <Lightformer intensity={0.4} position={[5, 1, -4]} scale={[5, 4, 1]} color={'#8f6fc9'} />
        </Environment>
        {showArm && (
          <Suspense fallback={null}>
            <ArmAssembly />
          </Suspense>
        )}
        <CameraRig />
        <PaintOnSettle />
      </Canvas>
    </div>
  )
}
