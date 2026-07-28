/* Fixed chrome: the masthead and the read-progress hairline.

   What used to live here — a BUILD readout, a Vancouver clock, humming
   column guides — was instrumentation for its own sake. The only
   persistent readout left is the one that answers a question a reader
   actually has on a long page: how much of this is left. */
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const PAGES = [
  { to: '/about', label: 'About' },
  { to: '/projects', label: 'Projects' },
  { to: '/resume', label: 'Resume' },
  { to: '/contact', label: 'Contact' },
]

/* The same bar on every page, landing included — same height, same
   margins, same four words in the same place. Only the left-hand slot
   changes: the landing already has the name set six times this size a
   few hundred pixels below, so printing it again in the corner would
   be the bar saying something the page has already said. It carries
   the dateline there instead. */
export function Nav() {
  const { pathname } = useLocation()
  const [sunk, setSunk] = useState(false)
  const home = pathname === '/'

  /* the masthead sits on bare paper at the top of a page and only
     grows its hairline once content has passed under it */
  useEffect(() => {
    const onScroll = () => setSunk(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`masthead${sunk ? ' is-sunk' : ''}`}>
      {home ? (
        <p className="masthead-dateline label">Calgary &#8594; Vancouver</p>
      ) : (
        <Link to="/" className="masthead-name">
          Ekam Kooner
        </Link>
      )}
      <nav className="masthead-nav" aria-label="Sections">
        {PAGES.map((p) => (
          <Link
            key={p.to}
            to={p.to}
            className={`masthead-link${pathname === p.to ? ' is-active' : ''}`}
            aria-current={pathname === p.to ? 'page' : undefined}
          >
            {p.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}

/* A one-pixel accent rule across the top that fills as the page is
   read. It is the only thing on the site that moves without being
   asked to, and it is answering a question rather than performing. */
export function ReadProgress() {
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    let last = -1
    const loop = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 40 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      /* only touch the layer when the number actually changed */
      if (bar.current && Math.abs(p - last) > 0.0005) {
        last = p
        bar.current.style.transform = `scaleX(${p})`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="progress" aria-hidden>
      <div ref={bar} className="progress-bar" />
    </div>
  )
}
