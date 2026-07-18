/* ============================================================
   The five checkpoints of the session. Content is real copy
   from ekamkooner.com. Reveals are wired in App via ScrollTrigger
   — every reveal uses the same masked-line pattern + ease family.
   ============================================================ */
import { useState } from 'react'
import { PROJECTS, MANIFESTO_LINES, CONTACT, OFF_CLOCK, type Project } from '../data/projects'

export function Hero() {
  return (
    <section id="hero" className="section section-hero" data-section="hero">
      <p className="hero-eyebrow mono-label reveal">Biomedical engineering · Robotics · UBC</p>
      <h1 className="hero-name">
        <span className="mask-line">
          <span className="reveal-line">EKAM</span>
        </span>
        <span className="mask-line">
          <span className="reveal-line">KOONER</span>
        </span>
      </h1>
      <p className="hero-sub reveal">
        Embedded &amp; robotics software — building toward machines that show up for people.
      </p>
      <p className="hero-platform mono-xs reveal">PLATFORM · SO-ARM101 · OPEN HARDWARE</p>
      <div className="hero-cue mono-xs" aria-hidden>
        <span className="cue-line" />
        [ SCROLL ]
      </div>
    </section>
  )
}

export function Directive() {
  return (
    <section id="directive" className="section section-directive" data-section="directive">
      <p className="section-index mono-label reveal">01 / DIRECTIVE</p>
      <div className="directive-body">
        {MANIFESTO_LINES.map((line, i) => (
          <span key={i} className="mask-line">
            <span className={`reveal-line directive-line${i === 0 ? ' is-lead' : ''}`}>{line}</span>
          </span>
        ))}
      </div>
    </section>
  )
}

function ProjectRow({ p }: { p: Project }) {
  const [open, setOpen] = useState(false)
  return (
    <li className={`row${open ? ' is-open' : ''}`}>
      <button
        className="row-head"
        data-cursor={open ? 'CLOSE' : 'QUERY'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="row-index mono-label">{p.index}</span>
        <span className="row-title">{p.title}</span>
        <span className="row-tag mono-label">{p.tag}</span>
        <span className="row-cross" aria-hidden />
      </button>
      <div className="row-sheet" aria-hidden={!open}>
        <div className="sheet-inner">
          <p className="sheet-desc">{p.description}</p>
          <ul className="sheet-stack">
            {p.stack.map((s) => (
              <li key={s} className="mono-xs">
                {s}
              </li>
            ))}
          </ul>
          {p.awards && (
            <ul className="sheet-awards">
              {p.awards.map((a) => (
                <li key={a.title}>
                  <span className="mono-label">{a.title}</span>
                  <p>{a.body}</p>
                </li>
              ))}
            </ul>
          )}
          {p.links.length > 0 && (
            <div className="sheet-links">
              {p.links.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="mono-label link-wipe" data-cursor="OPEN">
                  {l.label} ↗
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

export function Systems() {
  return (
    <section id="systems" className="section section-systems" data-section="systems">
      <p className="section-index mono-label reveal">02 / SYSTEMS</p>
      <h2 className="section-title reveal">Things I've built.</h2>
      <ul className="rows">
        {PROJECTS.map((p) => (
          <ProjectRow key={p.id} p={p} />
        ))}
      </ul>
    </section>
  )
}

export function Operator() {
  return (
    <section id="operator" className="section section-operator" data-section="operator">
      <p className="section-index mono-label reveal">03 / OPERATOR</p>
      <div className="operator-grid">
        <div className="operator-bio">
          <h2 className="section-title reveal">The human in the loop.</h2>
          <p className="reveal">
            Biomedical Engineering student at UBC, aiming at humanoid robotics — embedded
            firmware with UBC Bionics, autonomous navigation since VEX, kinematics from first
            principles. Calgary raised, Vancouver based.
          </p>
          <p className="reveal">
            The goal isn't the technology. It's who the technology is able to serve.
          </p>
        </div>
        <div className="operator-side">
          <p className="mono-label reveal">IDLE PROCESSES</p>
          <ul className="chips">
            {OFF_CLOCK.map((c) => (
              <li key={c} className="mono-xs">
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export function Uplink() {
  return (
    <section id="uplink" className="section section-uplink" data-section="uplink">
      <p className="section-index mono-label reveal">04 / UPLINK</p>
      <p className="uplink-status mono-label reveal">{CONTACT.status}</p>
      <a className="uplink-cta" href={`mailto:${CONTACT.email}`} data-cursor="SEND" data-magnetic>
        <span className="mask-line">
          <span className="reveal-line">LET'S BUILD →</span>
        </span>
      </a>
      <div className="uplink-links">
        <a href={CONTACT.github} target="_blank" rel="noreferrer" className="mono-label link-wipe" data-cursor="OPEN">
          GITHUB
        </a>
        <a href={CONTACT.linkedin} target="_blank" rel="noreferrer" className="mono-label link-wipe" data-cursor="OPEN">
          LINKEDIN
        </a>
        <a href={`mailto:${CONTACT.email}`} className="mono-label link-wipe" data-cursor="SEND">
          {CONTACT.email}
        </a>
      </div>
      <footer className="uplink-footer mono-xs">
        <span>© 2026 EKAM KOONER · {CONTACT.location.toUpperCase()}</span>
        <span>[ SYSTEM IDLE ]</span>
      </footer>
    </section>
  )
}
