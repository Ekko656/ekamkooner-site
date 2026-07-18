/* ============================================================
   Five sections, plain names. Text blocks carry data-drift so
   they move with the scene instead of sitting frozen above it.
   ============================================================ */
import { useRef, useState } from 'react'
import { PROJECTS, MANIFESTO, CONTACT, OFF_CLOCK, type Project } from '../data/projects'

export function Hero() {
  return (
    <section id="hero" className="section section-hero" data-section="hero">
      <div className="hero-inner" data-drift="0.12">
        <h1 className="hero-name">
          <span className="mask-line">
            <span className="reveal-line">EKAM</span>
          </span>
          <span className="mask-line">
            <span className="reveal-line">KOONER</span>
          </span>
        </h1>
        <p className="hero-sub reveal">
          Biomedical Engineering student at UBC.
          <br />
          <em>I build robots that help people.</em>
        </p>
      </div>
      <div className="hero-cue" aria-hidden>
        <span className="cue-line" />
        <span className="cue-word">Scroll</span>
      </div>
    </section>
  )
}

export function Why() {
  return (
    <section id="why" className="section section-why" data-section="why">
      <p className="section-index reveal">
        <span className="index-num">01</span> Why
      </p>
      <div className="why-body" data-drift="0.2">
        <h2 className="why-lead">
          <span className="mask-line">
            <span className="reveal-line">{MANIFESTO.lead}</span>
          </span>
        </h2>
        {MANIFESTO.lines.map((line, i) => (
          <span key={i} className="mask-line">
            <span className={`reveal-line why-line${i >= 3 && i <= 5 ? ' is-aim' : ''}`}>{line}</span>
          </span>
        ))}
        <p className="why-close">
          <span className="mask-line">
            <span className="reveal-line">{MANIFESTO.close}</span>
          </span>
        </p>
      </div>
    </section>
  )
}

function ProjectRow({ p }: { p: Project }) {
  const [open, setOpen] = useState(false)
  const vid = useRef<HTMLVideoElement>(null)

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (vid.current) {
      if (next) vid.current.play().catch(() => {})
      else vid.current.pause()
    }
  }

  return (
    <li className={`row${open ? ' is-open' : ''}`}>
      <button className="row-head" data-cursor={open ? 'Close' : 'Open'} aria-expanded={open} onClick={toggle}>
        <span className="row-index">{p.index}</span>
        <span className="row-title">{p.title}</span>
        <span className="row-tag">{p.tag}</span>
        <span className="row-cross" aria-hidden />
      </button>
      <div className="row-sheet" aria-hidden={!open}>
        <div className="sheet-inner">
          <figure className="sheet-media">
            {p.media.type === 'video' ? (
              <video
                ref={vid}
                src={p.media.src}
                poster={p.media.poster}
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <img src={p.media.src} alt={p.title} loading="lazy" />
            )}
          </figure>
          <div className="sheet-body">
            <p className="sheet-desc">{p.description}</p>
            <ul className="sheet-stack">
              {p.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
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
          {p.awards && (
            <ul className="sheet-awards">
              {p.awards.map((a) => (
                <li key={a.title}>
                  <span className="award-title">{a.title}</span>
                  <p>{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  )
}

export function Projects() {
  return (
    <section id="projects" className="section section-projects" data-section="projects">
      <p className="section-index reveal">
        <span className="index-num">02</span> Projects
      </p>
      <h2 className="section-title reveal" data-drift="0.1">
        Things I have built.
      </h2>
      <ul className="rows">
        {PROJECTS.map((p) => (
          <ProjectRow key={p.id} p={p} />
        ))}
      </ul>
    </section>
  )
}

export function About() {
  return (
    <section id="about" className="section section-about" data-section="about">
      <p className="section-index reveal">
        <span className="index-num">03</span> About
      </p>
      <div className="about-grid">
        <div className="about-bio" data-drift="0.16">
          <h2 className="section-title reveal">Calgary raised. Vancouver based.</h2>
          <p className="reveal">
            I study Biomedical Engineering at UBC and I am aiming at humanoid robotics. Embedded
            firmware with UBC Bionics. Autonomous navigation since VEX. Kinematics from first
            principles.
          </p>
          <p className="reveal about-callout">
            The goal is not the technology. It is who the technology serves.
          </p>
        </div>
        <div className="about-side" data-drift="0.26">
          <p className="side-label reveal">Off the clock</p>
          <ul className="chips">
            {OFF_CLOCK.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export function Contact() {
  return (
    <section id="contact" className="section section-contact" data-section="contact">
      <p className="section-index reveal">
        <span className="index-num">04</span> Contact
      </p>
      <p className="contact-status reveal">{CONTACT.status}</p>
      <a className="contact-cta" href={`mailto:${CONTACT.email}`} data-cursor="Send" data-magnetic>
        <span className="mask-line">
          <span className="reveal-line">Let's build.</span>
        </span>
      </a>
      <div className="contact-links">
        <a href={CONTACT.github} target="_blank" rel="noreferrer" className="link-wipe" data-cursor="Open">
          GitHub
        </a>
        <a href={CONTACT.linkedin} target="_blank" rel="noreferrer" className="link-wipe" data-cursor="Open">
          LinkedIn
        </a>
        <a href={`mailto:${CONTACT.email}`} className="link-wipe" data-cursor="Send">
          {CONTACT.email}
        </a>
      </div>
      <footer className="contact-footer">Ekam Kooner 2026</footer>
    </section>
  )
}
