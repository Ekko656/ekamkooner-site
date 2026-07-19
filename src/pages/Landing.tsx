/* The front door. The humanoid stands full height on the right, feet
   meeting the bottom of the page, edges blended into the ground so it
   inhabits the scene instead of sitting on it. It fades up once its
   scene is actually ready, never popping in. */
import { Suspense, lazy, useState } from 'react'
import { Link } from 'react-router-dom'

const Spline = lazy(() => import('@splinetool/react-spline'))

const DOORS = [
  { to: '/about', index: '01', label: 'About' },
  { to: '/projects', index: '02', label: 'Projects' },
  { to: '/resume', index: '03', label: 'Resume' },
  { to: '/contact', index: '04', label: 'Contact' },
]

export default function Landing() {
  const [ready, setReady] = useState(false)
  return (
    <div className="page page-landing">
      <div className={`landing-robot${ready ? ' is-ready' : ''}`} aria-hidden>
        <Suspense fallback={null}>
          <Spline
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            onLoad={() => setReady(true)}
          />
        </Suspense>
      </div>
      <div className="landing-intro">
        <h1 className="landing-name">
          <span className="mask-line">
            <span className="reveal-line">EKAM</span>
          </span>
          <span className="mask-line">
            <span className="reveal-line">KOONER</span>
          </span>
        </h1>
        <p className="landing-sub reveal">Biomedical Engineering student at UBC, aiming at humanoid robotics.</p>
        <nav className="glint-nav" aria-label="Sections">
          {DOORS.map((d, i) => (
            <Link key={d.to} to={d.to} className="glint-btn" data-cursor="Enter" style={{ ['--i' as string]: i }}>
              <span className="glint-ring" aria-hidden />
              <span className="glint-face">
                <span className="glint-index">{d.index}</span>
                {d.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
