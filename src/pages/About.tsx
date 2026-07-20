/* ============================================================
   About: the manifesto in one serif voice, two intentional sizes.
   Lines resolve from a soft blur as they enter (unblur reveal),
   giving the scroll real character. The arm builds alongside and
   crosses the frame right -> left -> right, then lifts the
   off-clock card in at the very end.
   ============================================================ */
import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { session } from '../lib/session'

function Beat({
  side,
  children,
  variant = '',
}: {
  side: 'left' | 'right'
  children: ReactNode
  variant?: '' | 'hero' | 'tall'
}) {
  return (
    <section className={`beat beat-${side}${variant ? ` beat-${variant}` : ''}`}>
      <div className="beat-text">{children}</div>
    </section>
  )
}

const OFF_CLOCK = [
  { icon: '🏐', label: 'Volleyball' },
  { icon: '🏀', label: 'NBA' },
  { icon: '🎮', label: 'League of Legends' },
  { icon: '🎵', label: 'Drake' },
  { icon: '🥊', label: 'Boxing' },
]

export default function About() {
  const card = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* unblur reveal: each line resolves from a soft blur + rise once as it
         enters. A one-shot tween (not scrubbed) keeps the blur off the GPU
         except during the brief transition, so scrolling stays smooth. */
      gsap.utils.toArray<HTMLElement>('.unblur').forEach((el) => {
        const inView = el.getBoundingClientRect().top < window.innerHeight * 0.9
        /* stagger lines that share a beat so they resolve in a small
           cascade rather than all at once */
        const stack = Array.from(el.parentElement?.querySelectorAll(':scope > .unblur') ?? [])
        const stagger = stack.indexOf(el) * 0.09
        /* the line arrives in its own true colour, not a shared one, so
           .a-soft keeps its intentional dimmer tone */
        const trueColor = getComputedStyle(el).color
        gsap.fromTo(
          el,
          { opacity: 0, filter: 'blur(10px)', y: 24, color: 'rgba(228, 232, 245, 0.4)' },
          {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            color: trueColor,
            duration: 1.0,
            ease: 'mechOut',
            /* elements already on screen at load play on their own; the rest
               play as they scroll into view */
            delay: inView ? 0.25 + stagger : stagger,
            scrollTrigger: inView ? undefined : { trigger: el, start: 'top 84%' },
          },
        )
      })
    })

    let raf = 0
    const tick = () => {
      const reveal = Math.min(1, Math.max(0, (session.cardPull - 0.45) / 0.55))
      if (card.current) {
        card.current.style.opacity = String(reveal)
        card.current.style.transform = `translateY(${(1 - reveal) * 150}px) scale(${0.96 + reveal * 0.04})`
        card.current.style.pointerEvents = reveal > 0.9 ? 'auto' : 'none'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      ctx.revert()
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="page page-about">
      <Beat side="left" variant="hero">
        <h1 className="a-lead unblur">Who is engineering for?</h1>
      </Beat>

      <Beat side="left">
        <p className="a-body unblur">It's a question I keep coming back to.</p>
      </Beat>

      <Beat side="left">
        <p className="a-body unblur">Most of what gets built today is built for the people who need it least.</p>
      </Beat>

      <Beat side="right">
        <p className="a-body unblur">Faster trading algorithms.</p>
        <p className="a-body unblur">Sharper ad targeting.</p>
        <p className="a-body unblur">Another delivery app.</p>
        <p className="a-body a-soft unblur">
          Sharp minds, pointed at the easiest problems with the loudest payouts.
        </p>
      </Beat>

      <Beat side="right" variant="tall">
        <h2 className="a-lead unblur">
          I want to spend my life pointed <em>somewhere else.</em>
        </h2>
      </Beat>

      <Beat side="right">
        <p className="a-body unblur">At the older person who can't reach the top shelf anymore.</p>
        <p className="a-body unblur">At the hospital running short on night staff.</p>
        <p className="a-body unblur">At the parent who needs an extra set of hands.</p>
      </Beat>

      <Beat side="left">
        <p className="a-body unblur">This is why I study Biomedical Engineering at UBC,</p>
        <p className="a-body unblur">and why I'm aiming at humanoid robotics.</p>
        <p className="a-body a-soft unblur">Not for the technology, but for who the technology is able to serve.</p>
      </Beat>

      <Beat side="left" variant="tall">
        <h2 className="a-lead unblur">Everything I build comes back to that.</h2>
      </Beat>

      <section className="beat beat-end" aria-hidden />

      <aside className="oc-card" ref={card}>
        <p className="oc-kicker">When I'm not building</p>
        <p className="oc-title">Off the clock</p>
        <ul className="oc-list">
          {OFF_CLOCK.map((o) => (
            <li key={o.label}>
              <span className="oc-icon">{o.icon}</span>
              {o.label}
            </li>
          ))}
        </ul>
        <p className="oc-foot">Thanks for reading this far.</p>
      </aside>
    </div>
  )
}

export function bindAboutScroll() {
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    session.aboutProgress = p
    session.assemblyTarget = Math.min(1, p / 0.8)
    session.cardPull = Math.min(1, Math.max(0, (p - 0.8) / 0.2))
  }
  update()
  ScrollTrigger.create({ onUpdate: update, start: 0, end: 'max' })
  return update
}
