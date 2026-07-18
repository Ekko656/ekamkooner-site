/* ============================================================
   About: the manifesto and the machine, one scroll experience.
   Text blocks alternate sides while the camera orbits the arm
   to the opposite side, so words and machine share the frame
   without ever fighting. Scroll drives the build continuously.
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

export default function About() {
  useEffect(() => {
    /* scrubbed line reveals: text animates WITH the scroll, both ways */
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.scrub-line').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0.08, y: 34 },
          {
            opacity: 1,
            y: 0,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 55%', scrub: true },
          },
        )
      })
      gsap.utils.toArray<HTMLElement>('.words').forEach((el) => {
        gsap.to(el.querySelectorAll('.word'), {
          y: 0,
          stagger: 0.06,
          ease: 'mechOut',
          duration: 0.9,
          overwrite: 'auto',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        })
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
      <section className="ab-block ab-left">
        <div className="ab-text">
          <h1 className="ab-lead">
            <Words text="Who is engineering for?" />
          </h1>
          <p className="ab-line scrub-line">It is a question I keep coming back to.</p>
          <p className="ab-line scrub-line is-dim">
            Most of what gets built today is built for the people who need it least.
          </p>
          <p className="ab-line scrub-line is-dim">Faster trading algorithms.</p>
          <p className="ab-line scrub-line is-dim">Sharper ad targeting.</p>
          <p className="ab-line scrub-line is-dim">Another delivery app.</p>
          <p className="ab-line scrub-line">
            Sharp minds, pointed at the easiest problems with the loudest payouts.
          </p>
        </div>
      </section>

      <section className="ab-block ab-right">
        <div className="ab-text">
          <h2 className="ab-lead-2">
            <Words text="I want to spend my life pointed somewhere else." />
          </h2>
          <p className="ab-line scrub-line is-aim">At the older person who cannot reach the top shelf anymore.</p>
          <p className="ab-line scrub-line is-aim">At the hospital running short on night staff.</p>
          <p className="ab-line scrub-line is-aim">At the parent who needs an extra set of hands.</p>
          <p className="ab-line scrub-line">This is why I study Biomedical Engineering at UBC.</p>
          <p className="ab-line scrub-line">This is why I am aiming at humanoid robotics.</p>
          <p className="ab-line scrub-line is-dim">Not for the technology. For who the technology is able to serve.</p>
        </div>
      </section>

      <section className="ab-block ab-left ab-final">
        <div className="ab-text">
          <h2 className="ab-close">
            <Words text="Everything I build comes back to that." />
          </h2>
          <p className="ab-line scrub-line">
            Embedded firmware with UBC Bionics. Autonomous navigation since VEX. Kinematics from
            first principles.
          </p>
          <p className="ab-line scrub-line is-dim">Calgary raised. Vancouver based.</p>
          <div className="ab-offclock">
            <p className="side-label scrub-line">Off the clock</p>
            <ul className="chips">
              {OFF_CLOCK.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <p className="ab-line scrub-line ab-thanks is-dim">If you read this far, thank you.</p>
        </div>
      </section>
    </div>
  )
}

/* wire scroll to the build and the camera path; exported for App to call
   after the page mounts so measurements are correct */
export function bindAboutScroll() {
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    session.aboutProgress = p
    /* build completes at 88 percent of the page so the lock and the wake
       up happen while the finale is still on screen */
    session.assemblyTarget = Math.min(1, p / 0.88)
  }
  update()
  ScrollTrigger.create({ onUpdate: update, start: 0, end: 'max' })
  return update
}
