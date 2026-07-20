/* The front door. The humanoid stands full height on the right, feet
   meeting the bottom of the page, edges blended into the ground so it
   inhabits the scene instead of sitting on it. It fades up once its
   scene is actually ready, never popping in.

   The entrance is one clock: the name gathers out of the dark first, the
   line beneath it rises as the name lands, then the keys walk in. The
   robot fades on the same curve and duration, so however long its scene
   takes to arrive it reads as part of the same movement. */
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import GlassButton from '../ui/GlassButton'
import ParticleText from '../ui/ParticleText'

const Spline = lazy(() => import('@splinetool/react-spline'))

const DOORS = [
  { to: '/about', index: '01', label: 'About' },
  { to: '/projects', index: '02', label: 'Projects' },
  { to: '/resume', index: '03', label: 'Resume' },
  { to: '/contact', index: '04', label: 'Contact' },
]

/* the name's motes start gathering here; everything else is placed
   against this so the sequence stays readable as one gesture */
const NAME_AT = 0.15

export default function Landing() {
  const [ready, setReady] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const nameLines = useMemo(() => ['EKAM', 'KOONER'], [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline()
        /* the name is mid-gather by now, so the line lifts into it */
        .to('.landing-sub', { opacity: 1, y: 0, duration: 0.85, ease: 'mechOut' }, 0.75)
        .to(
          '.glass-btn',
          { opacity: 1, y: 0, duration: 0.7, ease: 'mechOut', stagger: 0.075 },
          1.05,
        )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div className="page page-landing" ref={root}>
      <div className={`landing-robot${ready ? ' is-ready' : ''}`} aria-hidden>
        <Suspense fallback={null}>
          <Spline
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            onLoad={() => setReady(true)}
          />
        </Suspense>
      </div>
      <div className="landing-intro">
        <ParticleText
          as="h1"
          className="landing-name"
          lines={nameLines}
          label="Ekam Kooner"
          step={2.2}
          repel={118}
          delay={NAME_AT}
        />
        <p className="landing-sub">
          Biomedical Engineering student at UBC, aiming at humanoid robotics.
        </p>
        <nav className="glass-nav" aria-label="Sections">
          {DOORS.map((d, i) => (
            <GlassButton key={d.to} to={d.to} index={d.index} label={d.label} i={i} />
          ))}
        </nav>
      </div>
    </div>
  )
}
