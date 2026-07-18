/* The front door: name, identity, headshot, four big doors.
   Everything enters with the same masked reveal vocabulary. */
import { Link } from 'react-router-dom'

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
          <figure className="landing-photo reveal">
            <img src="/headshot.jpg" alt="Ekam Kooner" width={400} height={400} />
            <figcaption>Vancouver, BC</figcaption>
          </figure>
        </div>
        <nav className="doors" aria-label="Sections">
          {DOORS.map((d, i) => (
            <Link key={d.to} to={d.to} className="door" data-cursor="Enter" style={{ ['--i' as string]: i }}>
              <span className="door-index">{d.index}</span>
              <span className="door-label">
                <span className="mask-line">
                  <span className="reveal-line">{d.label}</span>
                </span>
              </span>
              <span className="door-tick" aria-hidden />
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
