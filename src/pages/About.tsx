/* ============================================================
   About: the story, one beat at a time. Each beat owns its own
   stretch of scroll with its own typographic voice, while the
   camera orbits the machine to the opposite side of the text.
   ============================================================ */
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { session } from '../lib/session'
import { OFF_CLOCK } from '../data/projects'

function Words({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`words ${className}`}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="word-mask">
          <span className="word">{w}</span>
        </span>
      ))}
    </span>
  )
}

/* one story beat: a block of scroll with a single thought */
function Beat({
  side,
  size = 'md',
  children,
  tall = false,
}: {
  side: 'left' | 'right'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  tall?: boolean
}) {
  return (
    <section className={`beat beat-${side} beat-${size}${tall ? ' beat-tall' : ''}`}>
      <div className="beat-text">{children}</div>
    </section>
  )
}

export default function About() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.scrub-line').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0.06, y: 40 },
          {
            opacity: 1,
            y: 0,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 94%', end: 'top 52%', scrub: true },
          },
        )
      })
      gsap.utils.toArray<HTMLElement>('.words').forEach((el) => {
        gsap.to(el.querySelectorAll('.word'), {
          y: 0,
          stagger: 0.07,
          ease: 'mechOut',
          duration: 0.9,
          overwrite: 'auto',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        })
      })
      /* tracked lines breathe open as they arrive */
      gsap.utils.toArray<HTMLElement>('.track-in').forEach((el) => {
        gsap.fromTo(
          el,
          { letterSpacing: '0.34em', opacity: 0 },
          {
            letterSpacing: '0.1em',
            opacity: 1,
            duration: 1.1,
            ease: 'mechOut',
            scrollTrigger: { trigger: el, start: 'top 86%' },
          },
        )
      })
      gsap.utils.toArray<HTMLElement>('.chips li').forEach((el, i) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: i * 0.07,
          ease: 'mechOut',
          overwrite: 'auto',
          scrollTrigger: { trigger: el.parentElement, start: 'top 85%' },
        })
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <div className="page page-about">
      <Beat side="left" size="xl" tall>
        <h1 className="b-display">
          <Words text="Who is engineering for?" />
        </h1>
      </Beat>

      <Beat side="left" size="sm">
        <p className="b-mono track-in">It is a question I keep coming back to</p>
      </Beat>

      <Beat side="left" size="lg">
        <p className="b-big scrub-line">
          Most of what gets built today is built for the people who
          <em> need it least.</em>
        </p>
      </Beat>

      <Beat side="left" size="md">
        <p className="b-list scrub-line">Faster trading algorithms.</p>
        <p className="b-list scrub-line">Sharper ad targeting.</p>
        <p className="b-list scrub-line">Another delivery app.</p>
        <p className="b-quiet scrub-line">
          Sharp minds, pointed at the easiest problems with the loudest payouts.
        </p>
      </Beat>

      <Beat side="right" size="xl" tall>
        <h2 className="b-display-2">
          <Words text="I want to spend my life pointed" />
          <span className="b-accent">
            <Words text="somewhere else." />
          </span>
        </h2>
      </Beat>

      <Beat side="right" size="lg">
        <p className="b-aim scrub-line">At the older person who cannot reach the top shelf anymore.</p>
        <p className="b-aim scrub-line">At the hospital running short on night staff.</p>
        <p className="b-aim scrub-line">At the parent who needs an extra set of hands.</p>
      </Beat>

      <Beat side="right" size="md">
        <p className="b-why scrub-line">This is why I am in Biomedical Engineering at UBC.</p>
        <p className="b-why scrub-line">
          This is why I am aiming at <em>humanoid robotics.</em>
        </p>
        <p className="b-quiet scrub-line">Not for the technology. For who the technology is able to serve.</p>
      </Beat>

      <Beat side="left" size="xl" tall>
        <h2 className="b-close">
          <Words text="Everything I build comes back to that." />
        </h2>
      </Beat>

      <Beat side="left" size="md">
        <p className="b-bio scrub-line">Embedded firmware with UBC Bionics.</p>
        <p className="b-bio scrub-line">Autonomous navigation since VEX.</p>
        <p className="b-bio scrub-line">Kinematics from first principles.</p>
        <p className="b-mono-dim scrub-line">Calgary raised, Vancouver based</p>
      </Beat>

      <Beat side="left" size="md">
        <p className="side-label scrub-line">Off the clock</p>
        <ul className="chips">
          {OFF_CLOCK.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="b-thanks scrub-line">If you read this far, thank you.</p>
      </Beat>
    </div>
  )
}

/* scroll drives the build and the camera orbit; called by App on mount */
export function bindAboutScroll() {
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    session.aboutProgress = p
    session.assemblyTarget = Math.min(1, p / 0.88)
  }
  update()
  ScrollTrigger.create({ onUpdate: update, start: 0, end: 'max' })
  return update
}
