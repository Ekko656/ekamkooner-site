/* A compact reticle: solid dot, sturdy ring, plain word labels.
   Weighted follow, quick contract on press. */
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')
  const [active, setActive] = useState(false)
  const [fine, setFine] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    setFine(mq.matches)
    if (!mq.matches) return

    const pos = { x: -100, y: -100 }
    const lag = { x: -100, y: -100 }

    const move = (e: PointerEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      gsap.set(dot.current, { x: pos.x, y: pos.y })
      const t = (e.target as HTMLElement)?.closest?.('[data-cursor]') as HTMLElement | null
      setLabel(t?.dataset.cursor ?? '')
      setActive(!!t)
    }
    const down = () => gsap.to(ring.current, { scale: 0.78, duration: 0.12, ease: 'mechSnap' })
    const up = () => gsap.to(ring.current, { scale: 1, duration: 0.28, ease: 'mechOut' })

    let raf = 0
    const loop = () => {
      lag.x += (pos.x - lag.x) * 0.24
      lag.y += (pos.y - lag.y) * 0.24
      gsap.set(ring.current, { x: lag.x, y: lag.y })
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
  return (
    <>
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className={`cursor-ring${active ? ' is-active' : ''}`}>
        {label && <span className="cursor-label">{label}</span>}
      </div>
    </>
  )
}
