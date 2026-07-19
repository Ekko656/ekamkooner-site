/* ============================================================
   About: the story from the old site, retold in the navy world.
   Three voices, strict roles. One thought per beat, each line
   rising in on arrival, key phrases bold and signal. The machine
   builds itself part by part alongside, camera orbiting so words
   and machine never share ground.
   ============================================================ */
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { session } from '../lib/session'

function Beat({
  side,
  children,
  tall = false,
}: {
  side: 'left' | 'right'
  children: React.ReactNode
  tall?: boolean
}) {
  return (
    <section className={`beat beat-${side}${tall ? ' beat-tall' : ''}`}>
      <div className="beat-text">{children}</div>
    </section>
  )
}

export default function About() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      /* one animation for every story line: rise in on arrival,
         gently staggered when lines share a beat */
      gsap.utils.toArray<HTMLElement>('.beat').forEach((beat) => {
        const lines = beat.querySelectorAll('.line-in')
        if (!lines.length) return
        gsap.to(lines, {
          opacity: 1,
          y: 0,
          duration: 1.0,
          stagger: 0.22,
          ease: 'mechOut',
          overwrite: 'auto',
          scrollTrigger: { trigger: beat, start: 'top 72%' },
          onComplete: () => lines.forEach((l) => l.classList.add('is-in')),
        })
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <div className="page page-about">
      <Beat side="left" tall>
        <h1 className="v-state line-in">Who is engineering for?</h1>
      </Beat>

      <Beat side="left">
        <p className="v-body line-in">It's a question I keep coming back to.</p>
      </Beat>

      <Beat side="left">
        <p className="v-body line-in">
          Most of what gets built today is built for <em>the people who need it least.</em>
        </p>
      </Beat>

      <Beat side="left">
        <p className="v-body line-in">Faster trading algorithms.</p>
        <p className="v-body line-in">Sharper ad targeting.</p>
        <p className="v-body line-in">Another delivery app.</p>
        <p className="v-quiet line-in">
          Sharp minds, pointed at the easiest problems with the loudest payouts.
        </p>
      </Beat>

      <Beat side="right" tall>
        <h2 className="v-state line-in">
          I want to spend my life pointed <em>somewhere else.</em>
        </h2>
      </Beat>

      <Beat side="right">
        <p className="v-body line-in">
          At the <em>older person</em> who can't reach the top shelf anymore.
        </p>
        <p className="v-body line-in">
          At the <em>hospital</em> running short on night staff.
        </p>
        <p className="v-body line-in">
          At the <em>parent</em> who needs an extra set of hands.
        </p>
      </Beat>

      <Beat side="right">
        <p className="v-body line-in">
          This is why I'm in <em>Biomedical Engineering</em> at UBC.
        </p>
        <p className="v-body line-in">
          This is why I'm aiming at <em>humanoid robotics.</em>
        </p>
      </Beat>

      <Beat side="right">
        <p className="v-note line-in">Tesla Optimus, specifically.</p>
        <p className="v-quiet line-in">Not for the technology. For who the technology is able to serve.</p>
      </Beat>

      <Beat side="left" tall>
        <h2 className="v-state line-in">Everything I build comes back to that.</h2>
      </Beat>

      <Beat side="left">
        <p className="v-body line-in">Embedded firmware with UBC Bionics.</p>
        <p className="v-body line-in">Autonomous navigation since VEX.</p>
        <p className="v-body line-in">Kinematics from first principles.</p>
        <p className="v-quiet line-in">
          Off the clock: volleyball, the NBA, League of Legends, Drake, boxing.
        </p>
      </Beat>

      <Beat side="left">
        <p className="v-note line-in">If you read this far, thank you.</p>
      </Beat>
    </div>
  )
}

/* scroll drives the build and the camera orbit; App calls this on mount */
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
