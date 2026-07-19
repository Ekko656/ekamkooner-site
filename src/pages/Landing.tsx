/* The front door: name and a short line on the left with four solid
   panel buttons beneath, the interactive 3D robot on the right. The
   robot follows the cursor, so the whole page feels awake. */
import { Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'

const Spline = lazy(() => import('@splinetool/react-spline'))

const DOORS = [
  { to: '/about', index: '01', label: 'About' },
  { to: '/projects', index: '02', label: 'Projects' },
  { to: '/resume', index: '03', label: 'Resume' },
  { to: '/contact', index: '04', label: 'Contact' },
]

export default function Landing() {
  return (
    <div className="page page-landing">
      <div className="landing-grid">
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
          <nav className="panel-nav" aria-label="Sections">
            {DOORS.map((d, i) => (
              <Link key={d.to} to={d.to} className="panel-btn" data-cursor="Enter" style={{ ['--i' as string]: i }}>
                <span className="panel-btn-index">{d.index}</span>
                <span className="panel-btn-label">{d.label}</span>
                <span className="panel-btn-fill" aria-hidden />
              </Link>
            ))}
          </nav>
        </div>
        <div className="landing-robot reveal">
          <Suspense fallback={<div className="robot-loading">Waking the robot</div>}>
            <Spline scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
