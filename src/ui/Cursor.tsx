/* A compact reticle: solid dot, sturdy ring, plain word labels.
   Weighted follow, quick contract on press. */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { perf } from '../lib/perf'

export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')
  const [active, setActive] = useState(false)
  const [fine, setFine] = useState(false)

  useEffect(() => {
    /* A hand-drawn reticle replaces the OS cursor, which means its lag
       IS the pointer's lag. On a machine that cannot keep the frame rate
       up that turns every mouse movement into something that feels
       broken, so the low tier hands the pointer back to the system. */
    if (perf.low) return
    const mq = window.matchMedia('(pointer: fine)')
    setFine(mq.matches)
    if (!mq.matches) return

    const pos = { x: -100, y: -100 }
    const lag = { x: -100, y: -100 }

    /* The label only changes when the pointer crosses into or out of a
       labelled element. Setting state unconditionally re-rendered the
       whole component on every single pointermove - React reconciliation
       at pointer rate, for a value that was almost always the same. */
    let lastLabel = ''
    const move = (e: PointerEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      gsap.set(dot.current, { x: pos.x, y: pos.y })
      const t = (e.target as HTMLElement)?.closest?.('[data-cursor]') as HTMLElement | null
      const next = t?.dataset.cursor ?? ''
      if (next !== lastLabel) {
        lastLabel = next
        setLabel(next)
        setActive(!!t)
      }
    }
    const down = () => gsap.to(ring.current, { scale: 0.78, duration: 0.12, ease: 'mechSnap' })
    const up = () => gsap.to(ring.current, { scale: 1, duration: 0.28, ease: 'mechOut' })

    /* the weighted ring chases the dot; once it has caught up there is
       nothing to write, so the loop idles instead of setting the same
       transform every frame for as long as the pointer sits still */
    let raf = 0
    const loop = () => {
      const dx = pos.x - lag.x
      const dy = pos.y - lag.y
      if (dx * dx + dy * dy > 0.01) {
        lag.x += dx * 0.24
        lag.y += dy * 0.24
        gsap.set(ring.current, { x: lag.x, y: lag.y })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  if (!fine) return null
  return createPortal(
    <>
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className={`cursor-ring${active ? ' is-active' : ''}`}>
        {label && <span className="cursor-label">{label}</span>}
      </div>
    </>,
    document.body,
  )
}
