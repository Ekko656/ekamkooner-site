/* The front door.

   Paper on the left, machine on the right. Navigation lives in the top
   bar with every other page's, so arriving here and arriving anywhere
   else put the same four words in the same place.

   The name block is centred in its own column and sits low, so the eye
   lands on the machine first and reads the name second. Its character
   is in the ink itself: the letterforms carry a slow vertical ramp from
   near-black down into a deep violet, so the type has depth and a hint
   of the accent without anything being drawn around it.

   The entrance is one clock: the name rises, the role line follows,
   the sub-line after it, the marks walk in, and the humanoid fades on
   the same curve, so however long its scene takes to arrive it reads
   as one movement rather than a load event. */
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { perf } from '../lib/perf'
import Marks from '../ui/Marks'

const Spline = lazy(() => import('@splinetool/react-spline'))

const NAME = ['Ekam', 'Kooner']

/* Stop the humanoid being cropped by its own scene.

   The Spline file frames itself on the machine's head, so at any window
   size the legs ran off the bottom. None of the obvious levers work:
   a perspective camera's vertical extent is fixed by its field of view,
   so resizing the canvas only changes how much is cut off the SIDES,
   and both `setZoom` and moving `Camera 2` are overwritten every frame
   by the scene's own camera animation.

   The framing is a three-quarter portrait: head down to mid-thigh, cut
   off by the bottom of the page. A full standing figure was tried and
   left too much empty paper around it; a head-and-shoulders bust cropped
   too tight. This fills the column and still reads as a whole machine.

   Values are empirical. If the Spline scene is ever republished they
   will need re-measuring; the names to look for are "Bot" (the model
   root) and "Camera 2". */
const BOT_SCALE = 0.62
const BOT_Y = 168
/* The scene parks Camera 2 at (0, 249, 360), framed on the head, and
   then flies it. Pinning z alone fixed the crop but left the drift:
   the machine rose about 215px in five seconds and sailed off the top
   of the page. The whole position has to be held, not just the depth. */
const CAM_X = 0
const CAM_Y = 249
const CAM_Z = 810

type Vec3 = { x: number; y: number; z: number }
type SplineObj = { scale: Vec3; position: Vec3; rotation: Vec3 }
type SplineApp = {
  findObjectByName: (n: string) => SplineObj | undefined
  setGlobalEvents?: (global: boolean) => void
  requestRender?: () => void
}

/* Pinning the fit, rather than setting it once.

   Two things fight a one-shot write. `onLoad` fires before the scene's
   own `start` event has run, and a transform written at that moment is
   read back correctly while the render still shows the original
   framing. And the scene re-frames itself from pointer events, which
   the React component listens for on the whole window — so moving the
   cursor anywhere, including over the name, pushed the camera in until
   the legs were cut off. That is the intermittent cropping.

   Global events stay ON — they are what makes the machine track the
   cursor, which is worth keeping. What was never worth keeping was
   letting them move the CAMERA. So the camera's whole transform,
   position AND rotation, is re-asserted every frame: that pins the
   frame while leaving the scene free to turn the machine inside it.
   The Bot's root is pinned the same way, and only the root, so the
   model's own idle still plays underneath.

   A dozen property writes a frame against a scene already running a
   render loop, and it is the only version of this that cannot be
   raced. */
function pinRobot(app: unknown) {
  const a = app as SplineApp
  /* The scene's look-at is bound to pointer events, and the canvas sits
     under `pointer-events: none`, so the machine never saw the cursor —
     that is why it stopped following it. Global events listen on the
     window instead, so it tracks the pointer anywhere on the page
     without the canvas having to swallow clicks. */
  a.setGlobalEvents?.(true)
  /* The Spline canvas has the same first-paint sizing problem the r3f
     stage had: it can come up measured wrong, and since a perspective
     camera's framing depends on the canvas aspect, a wrong size shows
     as a wrong crop — the machine occasionally loading as a full body
     instead of the framing set here. One resize event after mount
     settles it. */
  /* Fired several times, not once. On a first load one nudge is enough,
     but coming BACK to the landing from another page the scene mounts
     into a container that is still settling, and a single early resize
     lands before the layout is final — which showed as the machine
     loading at the wrong size and sitting too high. */
  const nudges = [60, 300, 900].map((ms) =>
    window.setTimeout(() => window.dispatchEvent(new Event('resize')), ms),
  )
  let n = 0
  let raf = 0
  const tick = () => {
    /* a hair of jitter, alternating each frame: without a changed value
       the runtime treats the write as a no-op and never flushes */
    const eps = (n++ % 2) * 1e-4
    /* The camera is what actually widens the framing — it is parked
       close enough that the legs fall outside its field of view, and
       nothing about the canvas size can change that. Scaling the model
       alone only makes a cropped machine smaller. */
    const cam = a.findObjectByName?.('Camera 2')
    if (cam) {
      cam.position.x = CAM_X + eps
      cam.position.y = CAM_Y + eps
      cam.position.z = CAM_Z + eps
      /* rotation is deliberately NOT pinned: the look-at works by
         turning the camera, and holding it still is the other half of
         what killed the follow. Position alone stops the drift. */
    }
    const bot = a.findObjectByName?.('Bot')
    if (bot) {
      bot.scale.x = BOT_SCALE + eps
      bot.scale.y = BOT_SCALE + eps
      bot.scale.z = BOT_SCALE + eps
      bot.position.y = BOT_Y + eps
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => {
    nudges.forEach(window.clearTimeout)
    cancelAnimationFrame(raf)
  }
}

export default function Landing() {
  const [ready, setReady] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const cancelPin = useRef<(() => void) | null>(null)

  /* the loop is stopped by its own canceller on unmount — there is no
     separate "is this still mounted" flag, because under StrictMode the
     mount/unmount/mount cycle left that flag false at the moment the
     scene finished loading and the pin never ran a single frame */
  useEffect(() => () => cancelPin.current?.(), [])

  /* The name is solid ink until the cursor comes near it, then the
     violet ramp fades up under the letters and fades out again as you
     leave. A light that answers you rather than a permanent effect —
     black in a screenshot, alive in the hand. Distance is measured to
     the name's box, so approaching from any side works. */
  useEffect(() => {
    const el = root.current?.querySelector<HTMLElement>('.landing-name')
    if (!el) return
    const NEAR = 120 // fully lit at or inside this many px
    const FAR = 460 // fully dark beyond this
    let raf = 0
    let want = 0
    let have = 0
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right)
      const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom)
      const d = Math.hypot(dx, dy)
      want = 1 - Math.min(Math.max((d - NEAR) / (FAR - NEAR), 0), 1)
    }
    const loop = () => {
      have += (want - have) * 0.12
      el.style.setProperty('--lit', have.toFixed(3))
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', onMove)
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline()
        .to('.landing-name .reveal-line', { y: 0, duration: 1.05, ease: 'mechOut', stagger: 0.09 }, 0.15)
        .to('.landing-role', { opacity: 1, y: 0, duration: 0.7, ease: 'mechOut' }, 0.6)
        .to('.landing-sub', { opacity: 1, y: 0, duration: 0.8, ease: 'mechOut' }, 0.74)
        .to('.mark', { opacity: 1, y: 0, duration: 0.65, ease: 'mechOut', stagger: 0.08 }, 0.92)
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div className="page page-landing" ref={root}>
      {/* The humanoid is a Spline scene with its own renderer and its own
          camera animation, which framed itself tight enough to crop the
          machine against the edges of its column. The scene cannot be
          re-framed from CSS — a perspective camera's vertical extent is
          fixed by its field of view, so resizing the box only changes
          how much is cut off the sides. Pulling the runtime's zoom back
          on load is the one lever that actually widens the framing. */}
      {!perf.low && (
        <div className={`landing-robot${ready ? ' is-ready' : ''}`} aria-hidden>
          <Suspense fallback={null}>
            <Spline
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              onLoad={(app) => {
                cancelPin.current?.()
                cancelPin.current = pinRobot(app)
                setReady(true)
              }}
            />
          </Suspense>
        </div>
      )}

      <div className="landing-intro">
        <h1 className="landing-name">
          {NAME.map((word) => (
            <span className="mask-line" key={word}>
              <span className="reveal-line">
                {/* the lit copy, faded in over the solid ink by proximity */}
                <span className="name-lit" aria-hidden>
                  {word}
                </span>
                {word}
              </span>
            </span>
          ))}
        </h1>

        <p className="landing-role label">
          Biomedical Engineering (Robotics Specialization) &middot; UBC
        </p>

        {/* broken on the sentence, not wherever the measure runs out —
            two clauses, two lines, and the second one lands alone */}
        <p className="landing-sub">
          Robot arms and grippers, for now.
          <br />
          Humanoids in the future.
        </p>

        <Marks />
      </div>
    </div>
  )
}
