/* Fixed chrome: monogram, section jump nav, build readout, local time.
   Plain words, no decoration language. */
import { useEffect, useRef, useState } from 'react'
import { SECTIONS, session, type SectionId } from '../lib/session'

export function GridLines() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const humming = Math.abs(session.velocity) > 0.4
      ref.current?.classList.toggle('is-humming', humming)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div ref={ref} className="layer-grid" aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  )
}

export function Grain() {
  return <div className="layer-grain" aria-hidden />
}

export function Nav({ onJump }: { onJump: (id: SectionId) => void }) {
  const [current, setCurrent] = useState<SectionId>('hero')
  useEffect(() => session.onSection(setCurrent), [])
  return (
    <header className="chrome chrome-nav">
      <button className="monogram" data-cursor="Top" onClick={() => onJump('hero')}>
        EKAM KOONER
      </button>
      <nav className="jump">
        {SECTIONS.filter((s) => s.id !== 'hero').map((s) => (
          <button
            key={s.id}
            className={`jump-item${current === s.id ? ' is-active' : ''}`}
            data-cursor="Go"
            onClick={() => onJump(s.id)}
          >
            <span className="jump-dot" />
            <span className="jump-index">{s.index}</span>
            {s.label}
          </button>
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
        new Date().toLocaleTimeString('en-CA', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        }),
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
