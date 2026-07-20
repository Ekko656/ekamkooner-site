/* ============================================================
   About: the manifesto in one serif voice, two intentional sizes.
   Lines resolve from a soft blur as they enter (unblur reveal),
   giving the scroll real character. The arm builds alongside and
   crosses the frame right -> left -> right, then lifts the
   off-clock card in at the very end.
   ============================================================ */
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { session } from '../lib/session'

function Beat({
  side,
  children,
  variant = '',
  flip = false,
}: {
  side: 'left' | 'right'
  children: ReactNode
  variant?: '' | 'hero' | 'tall'
  /* marks a beat that starts on the opposite side from the one before
     it; it carries extra lead-in so the camera and the machine have
     empty scroll to cross the frame in before any copy arrives */
  flip?: boolean
}) {
  return (
    <section
      className={`beat beat-${side}${variant ? ` beat-${variant}` : ''}${flip ? ' beat-flip' : ''}`}
    >
      <div className="beat-text">{children}</div>
    </section>
  )
}

/* Split an element's text into word spans, leaving nested markup (the
   <em> in the lead lines) intact, so the reveal can cascade word by
   word instead of resolving the whole line at once. */
function splitWords(el: HTMLElement): HTMLElement[] {
  /* Idempotent: the effect runs twice under StrictMode, and reverting the
     GSAP context restores styles but does not un-split the DOM. Splitting
     an already-split line would nest .w inside .w, and the tween would
     only reach the inner set while the outer stayed hidden. */
  const existing = el.querySelectorAll<HTMLElement>('.w')
  if (existing.length) return Array.from(existing)

  const words: HTMLElement[] = []
  const process = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ''
      if (!text.trim()) return
      const frag = document.createDocumentFragment()
      for (const part of text.split(/(\s+)/)) {
        if (!part) continue
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part))
          continue
        }
        const span = document.createElement('span')
        span.className = 'w'
        span.textContent = part
        frag.appendChild(span)
        words.push(span)
      }
      node.parentNode?.replaceChild(frag, node)
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(process)
    }
  }
  Array.from(el.childNodes).forEach(process)
  return words
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
        const lineDelay = stack.indexOf(el) * 0.14
        const words = splitWords(el)
        if (!words.length) return

        /* the soft closing thought of a beat carries its life in its
           motion, not in decoration: its words drift in slower, and the
           whole line breathes in from wide tracking to its resting set */
        const soft = el.classList.contains('a-soft')
        const delay = inView ? 0.25 + lineDelay : lineDelay
        const trigger = inView ? undefined : { trigger: el, start: 'top 84%' }

        gsap.fromTo(
          words,
          { opacity: 0, filter: 'blur(9px)', yPercent: soft ? 0 : 34, xPercent: soft ? 12 : 0 },
          {
            opacity: 1,
            filter: 'blur(0px)',
            yPercent: 0,
            xPercent: 0,
            duration: soft ? 1.2 : 0.85,
            ease: 'mechOut',
            /* words arrive in a cascade; the whole line still resolves
               quickly enough to read as one movement */
            stagger: soft ? 0.085 : 0.045,
            /* elements already on screen at load play on their own; the
               rest play as they scroll into view */
            delay,
            scrollTrigger: trigger,
            /* never clearProps the filter: it strips the inline blur(0)
               and the CSS base blur takes over, leaving text fuzzy */
            onComplete: () => {
              for (const wsp of words) wsp.style.willChange = 'auto'
            },
          },
        )
        if (soft) {
          gsap.fromTo(
            el,
            { letterSpacing: '0.09em' },
            {
              letterSpacing: '0.01em',
              duration: 1.7,
              ease: 'mechOut',
              delay,
              scrollTrigger: trigger ? { ...trigger } : undefined,
            },
          )
        }
      })
    })

    /* ---- the card pull ----
       No fade. The card waits below the bottom edge of the frame; the
       claw dives down past the edge, closes on it, and hauls it up. The
       card's top edge is pinned to the claw tip's projected position
       (session.grip) through a weighted spring, so it genuinely hangs
       from the machine: it lags on the way up like a load, sways with
       the claw's sideways motion, and keeps breathing with the idle
       drift once the lift is done. */
    let raf = 0
    let last = performance.now()
    const spring = { x: 0, y: 0, vx: 0, vy: 0, init: false }
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const el = card.current
      if (el) {
        const pull = session.cardPull
        const g = session.grip
        const w = el.offsetWidth
        /* the claw closes at 0.45 of the gesture: from then on the card
           is attached. Before that it idles out of sight below the
           frame, already under where the claw will dive. */
        const grabbed = pull > 0.45 && g.active
        const tx = (g.active ? g.x : window.innerWidth * 0.6) - w / 2
        const ty = grabbed ? g.y - 10 : window.innerHeight + 90
        if (!spring.init) {
          spring.x = tx
          spring.y = window.innerHeight + 260
          spring.init = true
        }
        /* stiff, near-critically-damped: heavy load, no rubber wobble */
        const wn = 15
        spring.vx += ((tx - spring.x) * wn * wn - 2 * 1.05 * wn * spring.vx) * dt
        spring.vy += ((ty - spring.y) * wn * wn - 2 * 1.05 * wn * spring.vy) * dt
        spring.x += spring.vx * dt
        spring.y += spring.vy * dt
        /* hangs from the grip point, so it tilts against sideways motion */
        const sway = Math.max(-5, Math.min(5, -spring.vx * 0.012))
        el.style.transform = `translate3d(${spring.x}px, ${spring.y}px, 0) rotate(${sway}deg)`
        el.style.pointerEvents = pull > 0.9 ? 'auto' : 'none'
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

      <Beat side="right" flip>
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

      <Beat side="left" flip>
        <p className="a-body unblur">This is why I study Biomedical Engineering at UBC,</p>
        <p className="a-body unblur">and why I'm aiming at humanoid robotics.</p>
        <p className="a-body a-soft unblur">Not for the technology, but for who the technology is able to serve.</p>
      </Beat>

      <Beat side="left" variant="tall">
        <h2 className="a-lead unblur">Everything I build comes back to that.</h2>
      </Beat>

      <section className="beat beat-end" aria-hidden />

      {/* Portaled to the body on purpose. `main` keeps a transform from
          the page entrance tween, and any transform makes an element the
          containing block for `position: fixed` — the card was resolving
          against a 6900px-tall `main` and sitting thousands of pixels off
          screen, so the pull looked like it never happened. Same trap the
          project detail panel hits; do not move this back inside. */}
      {createPortal(
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
        </aside>,
        document.body,
      )}
    </div>
  )
}

export function bindAboutScroll() {
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    session.aboutProgress = p
    /* the build completes at 0.82, and the closing gesture only begins at
       0.86, so the last statement ("Everything I build comes back to
       that.") lands and is read before the arm reaches for the card */
    session.assemblyTarget = Math.min(1, p / 0.82)
    session.cardPull = Math.min(1, Math.max(0, (p - 0.86) / 0.14))
  }
  update()
  ScrollTrigger.create({ onUpdate: update, start: 0, end: 'max' })
  return update
}
