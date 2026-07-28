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
    path: 'M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.13-.3-.54-1.53.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.23 0 4.63-2.8 5.65-5.48 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z',
  },
  {
    label: 'LinkedIn',
    href: CONTACT.linkedin,
    path: 'M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z',
  },
  {
    label: 'Email',
    href: `mailto:${CONTACT.email}`,
    path: 'M2 5.6A1.6 1.6 0 0 1 3.6 4h16.8A1.6 1.6 0 0 1 22 5.6v.5l-10 5.7L2 6.1v-.5zm0 2.8 9.5 5.4a1 1 0 0 0 1 0L22 8.4v10A1.6 1.6 0 0 1 20.4 20H3.6A1.6 1.6 0 0 1 2 18.4v-10z',
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

   What the animation does not touch is the model. Scaling the `Bot`
   root down and lifting it back up to the camera's eye line fits the
   whole figure in the column with room top and bottom — measured at
   1280x800, and stable because the machine is now well inside the
   frame rather than pressed against its edges.

   Values are empirical. If the Spline scene is ever republished they
   will need re-measuring; the names to look for are "Bot" (the model
   root) and "Camera 2". */
const BOT_SCALE = 0.46
const BOT_Y = 215
/* The scene parks Camera 2 at (0, 249, 360), framed on the head, and
   then flies it. Pinning z alone fixed the crop but left the drift:
   the machine rose about 215px in five seconds and sailed off the top
   of the page. The whole position has to be held, not just the depth. */
const CAM_X = 0
const CAM_Y = 249
const CAM_Z = 1020

type SplineObj = { scale: { x: number; y: number; z: number }; position: { x: number; y: number; z: number } }
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

   Global events go off (the canvas is already pointer-events: none, so
   nothing is lost), and the camera position and model transform are
   then re-asserted every frame for as long as this page is mounted. It is four property writes
   per frame against a scene that is already running a render loop, and
   it is the only version of this that cannot be raced. Only the Bot's
   ROOT transform is pinned, so the machine's own idle animation still
   plays underneath it. */
function pinRobot(app: unknown) {
  const a = app as SplineApp
  a.setGlobalEvents?.(false)
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
  return () => cancelAnimationFrame(raf)
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
              <span className="reveal-line">{word}</span>
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
          Humanoids are the future.
        </p>

        <nav className="marks" aria-label="Elsewhere">
          {MARKS.map((m) => (
            <a
              key={m.label}
              className="mark"
              href={m.href}
              aria-label={m.label}
              title={m.label}
              {...(m.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noreferrer' })}
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
