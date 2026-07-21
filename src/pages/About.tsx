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

    /* ---- the card: hauled up, then tossed into place ----
       No rope, no permanent grip. The card waits below the frame. When
       the jaws clamp (session.gripHold) the card is pinned by its TOP
       edge to the gripper's projected point, so the claw reads as holding
       the card's top while it hauls it up into view. The instant the jaws
       snap open the card is released with the velocity it had, and springs
       into its resting spot with a little arc and settle. Once it never
       has to stay locked to the moving claw, the flat-card / 3D-claw
       mismatch never gets a chance to show. */
    const REST = () => ({ x: window.innerWidth * 0.27, y: window.innerHeight * 0.46 })
    let raf = 0
    let last = performance.now()
    let mode: 'stowed' | 'held' | 'toss' = 'stowed'
    let cx = 0
    let cy = 0
    let vx = 0
    let vy = 0
    let spin = 0
    let spinV = 0
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const el = card.current
      if (!el) {
        raf = requestAnimationFrame(tick)
        return
      }
      const w = el.offsetWidth
      const h = el.offsetHeight
      const g = session.grip
      const holdNow = session.gripHold && g.active

      /* scrolled back out of the closing zone: stow it again */
      if (session.cardPull < 0.04 && mode !== 'held') mode = 'stowed'

      /* Safety net: gsap runs with lagSmoothing off, so one long frame
         (a backgrounded tab, a stutter) can advance the performance past
         the whole grab-to-release window between two ticks of this loop.
         If the release has already happened and we never saw the hold,
         drop the card straight into its resting spot rather than leaving
         it parked off screen forever. */
      if (mode === 'stowed' && session.cardTossed) {
        const rest = REST()
        cx = rest.x
        cy = rest.y
        vx = vy = spin = spinV = 0
        mode = 'toss'
      }

      if (holdNow) {
        /* the jaws hold the card's top edge, so its centre rides half a
           card-height below the gripper */
        const nx = g.x
        const ny = g.y + h / 2
        vx = (nx - cx) / Math.max(dt, 1e-3)
        vy = (ny - cy) / Math.max(dt, 1e-3)
        cx = nx
        cy = ny
        const targetSpin = Math.max(-7, Math.min(7, -vx * 0.02))
        spin += (targetSpin - spin) * Math.min(1, dt * 9)
        mode = 'held'
      } else if (mode === 'held') {
        /* The jaw snapped open mid-swing, so the card leaves on the arc
           it was already travelling: it keeps the upward speed it had and
           is thrown left, across the frame to its resting spot. */
        mode = 'toss'
        vy -= 120
        vx -= 620
        spinV = 26
      }

      if (mode === 'toss') {
        /* underdamped spring to the resting spot: a soft arc and settle */
        const rest = REST()
        const k = 46
        const c = 9.5
        vx += (k * (rest.x - cx) - c * vx) * dt
        vy += (k * (rest.y - cy) - c * vy) * dt
        cx += vx * dt
        cy += vy * dt
        spinV += (-k * spin - c * spinV) * dt
        spin += spinV * dt
      } else if (mode === 'stowed') {
        /* parked below the frame, under where the claw will dive */
        cx = g.active ? g.x : window.innerWidth * 0.6
        cy = window.innerHeight + h / 2 + 70
        vx = vy = spin = spinV = 0
      }

      el.style.transformOrigin = '50% 50%'
      el.style.transform = `translate3d(${cx - w / 2}px, ${cy - h / 2}px, 0) rotate(${spin}deg)`
      el.style.pointerEvents = mode === 'toss' && session.cardPull > 0.98 ? 'auto' : 'none'
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
          <div className="oc-head">
            <p className="oc-kicker">Off the clock</p>
            <span className="oc-serial" aria-hidden>
              EK · 05
            </span>
          </div>
          <p className="oc-title">When I&rsquo;m not building</p>
          <ul className="oc-list">
            {OFF_CLOCK.map((o) => (
              <li key={o.label}>
                <span className="oc-icon">{o.icon}</span>
                <span className="oc-item">{o.label}</span>
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
