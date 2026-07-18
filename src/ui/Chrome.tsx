/* Fixed chrome: monogram home link, page nav, build readout, local time. */
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { session } from '../lib/session'

const PAGES = [
  { to: '/about', label: 'About' },
  { to: '/projects', label: 'Projects' },
  { to: '/resume', label: 'Resume' },
  { to: '/contact', label: 'Contact' },
]

export function GridLines() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const loop = () => {
      ref.current?.classList.toggle('is-humming', Math.abs(session.velocity) > 0.4)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div ref={ref} className="layer-grid" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  )
}

export function Grain() {
  return <div className="layer-grain" aria-hidden />
}

export function Nav() {
  const { pathname } = useLocation()
  if (pathname === '/') return null
  return (
    <header className="chrome chrome-nav">
      <Link to="/" className="monogram" data-cursor="Home">
        EKAM KOONER
      </Link>
      <nav className="jump">
        {PAGES.map((p) => (
          <Link key={p.to} to={p.to} className={`jump-item${pathname === p.to ? ' is-active' : ''}`} data-cursor="Go">
            <span className="jump-dot" />
            {p.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}

export function Readouts() {
  const el = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const pct = Math.round(session.assembly * 100)
      if (el.current) el.current.innerText = `BUILD ${String(pct).padStart(3, '0')}`
      if (bar.current) bar.current.style.transform = `scaleX(${session.assembly})`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="chrome chrome-readouts" aria-hidden>
      <span ref={el} className="readout-text">
        BUILD 000
      </span>
      <span className="readout-track">
        <span ref={bar} className="readout-bar" />
      </span>
    </div>
  )
}

export function Clock() {
  const [now, setNow] = useState('')
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString('en-CA', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      )
    tick()
    const id = setInterval(tick, 5000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="chrome chrome-clock" aria-hidden>
      VANCOUVER {now}
    </div>
  )
}
