/* Fixed session chrome: monogram, section quick-jump, live readouts,
   local time. These never leave the screen — they ARE the HMI frame. */
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
      <button className="monogram" data-cursor="TOP" onClick={() => onJump('hero')}>
        EKAM KOONER
      </button>
      <nav className="jump">
        {SECTIONS.filter((s) => s.id !== 'hero').map((s) => (
          <button
            key={s.id}
            className={`jump-item mono-xs${current === s.id ? ' is-active' : ''}`}
            data-cursor="JUMP"
            onClick={() => onJump(s.id)}
          >
            <span className="jump-dot" />
            {s.index} / {s.label}
          </button>
        ))}
      </nav>
    </header>
  )
}

export function Readouts() {
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const loop = () => {
      if (el.current) {
        const s = SECTIONS.find((x) => x.id === session.section)!
        el.current.innerText = `[ SEC ${s.index} · ${s.label} ]  [ SCROLL ${String(Math.round(session.scroll * 100)).padStart(3, '0')}% ]  [ ASM ${String(Math.round(session.assembly * 100)).padStart(3, '0')}% ]`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <div ref={el} className="chrome chrome-readouts mono-xs" aria-hidden />
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
          second: '2-digit',
        }),
      )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="chrome chrome-clock mono-xs" aria-hidden>
      [ VANCOUVER {now} PT ]
    </div>
  )
}
