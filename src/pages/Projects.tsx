/* The board: a grid of project cards like the current site, upgraded.
   Cards tilt toward the cursor, media wakes on hover, and a click
   opens a full detail panel that slides up over the page. */
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { PROJECTS, type Project } from '../data/projects'

function Card({ p, onOpen }: { p: Project; onOpen: (p: Project) => void }) {
  const el = useRef<HTMLButtonElement>(null)
  const vid = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const card = el.current
    if (!card) return
    const rx = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'mechOut' })
    const ry = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'mechOut' })
    const move = (e: PointerEvent) => {
      const r = card.getBoundingClientRect()
      rx(((e.clientX - r.left) / r.width - 0.5) * 7)
      ry(-((e.clientY - r.top) / r.height - 0.5) * 7)
    }
    const enter = () => vid.current?.play().catch(() => {})
    const leave = () => {
      rx(0)
      ry(0)
      vid.current?.pause()
    }
    card.addEventListener('pointermove', move)
    card.addEventListener('pointerenter', enter)
    card.addEventListener('pointerleave', leave)
    return () => {
      card.removeEventListener('pointermove', move)
      card.removeEventListener('pointerenter', enter)
      card.removeEventListener('pointerleave', leave)
    }
  }, [])

  return (
    <button ref={el} className="card reveal" data-cursor="Open" onClick={() => onOpen(p)}>
      <figure className="card-media">
        {p.media.type === 'video' ? (
          <video ref={vid} src={p.media.src} poster={p.media.poster} muted loop playsInline preload="metadata" />
        ) : (
          <img src={p.media.src} alt={p.title} loading="lazy" />
        )}
      </figure>
      <span className="card-row">
        <span className="card-index">{p.index}</span>
        <span className="card-title">{p.title}</span>
        <span className="card-tag">{p.tag}</span>
      </span>
    </button>
  )
}

function Detail({ p, onClose }: { p: Project; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null)
  const vid = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    gsap.fromTo(panel.current, { yPercent: 6, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55, ease: 'mechOut' })
    vid.current?.play().catch(() => {})
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div className="detail" role="dialog" aria-label={p.title}>
      <div className="detail-panel" ref={panel}>
        <button className="detail-close" data-cursor="Close" onClick={onClose} aria-label="Close">
          <span />
          <span />
        </button>
        <figure className="detail-media">
          {p.media.type === 'video' ? (
            <video ref={vid} src={p.media.src} poster={p.media.poster} muted loop playsInline controls={false} />
          ) : (
            <img src={p.media.src} alt={p.title} />
          )}
        </figure>
        <div className="detail-body">
          <p className="detail-index">
            {p.index} <span>{p.tag}</span>
          </p>
          <h2 className="detail-title">{p.title}</h2>
          <p className="detail-desc">{p.description}</p>
          <ul className="sheet-stack">
            {p.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          {p.awards && (
            <ul className="detail-awards">
              {p.awards.map((a) => (
                <li key={a.title}>
                  <span className="award-title">{a.title}</span>
                  <p>{a.body}</p>
                </li>
              ))}
            </ul>
          )}
          {p.links.length > 0 && (
            <div className="sheet-links">
              {p.links.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="link-wipe" data-cursor="Open">
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const [open, setOpen] = useState<Project | null>(null)
  return (
    <div className="page page-projects">
      <header className="page-head">
        <p className="section-index reveal">
          <span className="index-num">02</span> Projects
        </p>
        <h1 className="page-title">
          <span className="mask-line">
            <span className="reveal-line">Things I have built.</span>
          </span>
        </h1>
      </header>
      <div className="board">
        {PROJECTS.map((p) => (
          <Card key={p.id} p={p} onOpen={setOpen} />
        ))}
      </div>
      {open && <Detail p={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
