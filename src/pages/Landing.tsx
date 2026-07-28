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
import { CONTACT } from '../data/projects'
import { perf } from '../lib/perf'

const Spline = lazy(() => import('@splinetool/react-spline'))

/* Marks, not words. Each is a single filled path so it holds its
   colour from one place and never needs a stroke weight reconciled
   against the page's hairlines. */
const MARKS = [
  {
    label: 'GitHub',
    href: CONTACT.github,
    path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  },
  {
    label: 'LinkedIn',
    href: CONTACT.linkedin,
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    label: 'Email',
    href: CONTACT.mail,
    path: 'M1.5 5.25A2.25 2.25 0 0 1 3.75 3h16.5a2.25 2.25 0 0 1 2.25 2.25v.383l-10.5 5.775L1.5 5.633V5.25Zm0 2.67v10.83A2.25 2.25 0 0 0 3.75 21h16.5a2.25 2.25 0 0 0 2.25-2.25V7.92l-9.858 5.42a2.25 2.25 0 0 1-2.284 0L1.5 7.92Z',
  },
]

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
/* the scene's resting camera tilt, held alongside the position so the
   lookAt behaviour turns the MACHINE without turning the frame */
const CAM_RX = 0.0145
const CAM_RY = 0
const CAM_RZ = 0

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
  /* The Spline canvas has the same first-paint sizing problem the r3f
     stage had: it can come up measured wrong, and since a perspective
     camera's framing depends on the canvas aspect, a wrong size shows
     as a wrong crop — the machine occasionally loading as a full body
     instead of the framing set here. One resize event after mount
     settles it. */
  const nudge = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 60)
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
      cam.rotation.x = CAM_RX + eps
      cam.rotation.y = CAM_RY + eps
      cam.rotation.z = CAM_RZ + eps
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
    window.clearTimeout(nudge)
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

        <nav className="marks" aria-label="Elsewhere">
          {MARKS.map((m) => (
            <a
              key={m.label}
              className="mark"
              href={m.href}
              aria-label={m.label}
              title={m.label}
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" aria-hidden focusable="false">
                <path d={m.path} fill="currentColor" />
              </svg>
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}
