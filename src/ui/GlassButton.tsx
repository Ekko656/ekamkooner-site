/* The fluid glass button, rebuilt to match the Framer reference:
   on hover the whole rim lights up, a frosty fog breathes inside the
   glass, and a few bright white motes drift through it. Click surges
   a ripple from the press point. Canvas + GSAP, no WebGL. */
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'

type Mote = { x: number; y: number; vx: number; vy: number; r: number; tw: number; ph: number }
type Blob = { ox: number; oy: number; rx: number; ry: number; r: number; sp: number; ph: number }
type Spark = { x: number; y: number; vx: number; vy: number; r: number; life: number; maxLife: number }

export default function GlassButton({ to, index, label, i }: { to: string; index: string; label: string; i: number }) {
  const btnRef = useRef<HTMLAnchorElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rippleRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const btn = btnRef.current
    const canvas = canvasRef.current
    if (!btn || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let w = 0
    let h = 0
    const resize = () => {
      const r = btn.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(btn)

    /* the frosty fog: a handful of large soft blobs that wander slowly
       inside the glass, only visible while the button is lit */
    const blobs: Blob[] = Array.from({ length: 4 }, () => ({
      ox: Math.random(),
      oy: 0.25 + Math.random() * 0.5,
      rx: 0.16 + Math.random() * 0.14,
      ry: 0.3 + Math.random() * 0.25,
      r: 0.55 + Math.random() * 0.35,
      sp: 0.25 + Math.random() * 0.3,
      ph: Math.random() * Math.PI * 2,
    }))
    /* a few bright white motes drifting through the fog */
    const motes: Mote[] = Array.from({ length: 7 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.03,
      vy: (Math.random() - 0.5) * 0.02,
      r: 0.7 + Math.random() * 1.1,
      tw: 1.2 + Math.random() * 2.2,
      ph: Math.random() * Math.PI * 2,
    }))
    let sparks: Spark[] = []

    let hovering = false
    let glow = 0
    let raf = 0
    let last = 0

    const tick = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05)
      last = t
      const ts = t / 1000

      glow += ((hovering ? 1 : 0) - glow) * Math.min(1, dt * 6)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.scale(dpr, dpr)

      if (glow > 0.01) {
        /* fog blobs, additive so overlaps read as thicker frost */
        ctx.globalCompositeOperation = 'lighter'
        for (const b of blobs) {
          const bx = (b.ox + Math.sin(ts * b.sp + b.ph) * b.rx) * w
          const by = (b.oy + Math.cos(ts * b.sp * 0.8 + b.ph) * b.ry * 0.4) * h
          const br = b.r * h
          const g = ctx.createRadialGradient(bx, by, 0, bx, by, br)
          g.addColorStop(0, `rgba(205, 220, 255, ${0.16 * glow})`)
          g.addColorStop(0.55, `rgba(190, 208, 255, ${0.07 * glow})`)
          g.addColorStop(1, 'rgba(190, 208, 255, 0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(bx, by, br, 0, Math.PI * 2)
          ctx.fill()
        }
        /* bright motes, twinkling */
        for (const m of motes) {
          m.x = (m.x + m.vx * dt + 1) % 1
          m.y = (m.y + m.vy * dt + 1) % 1
          const a = (0.35 + 0.65 * Math.abs(Math.sin(ts * m.tw + m.ph))) * glow
          ctx.beginPath()
          ctx.fillStyle = `rgba(240, 246, 255, ${a})`
          ctx.shadowColor = 'rgba(220, 232, 255, 0.95)'
          ctx.shadowBlur = 6
          ctx.arc(m.x * w, m.y * h, m.r, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }

      /* click sparks */
      sparks = sparks.filter((p) => p.life < p.maxLife)
      for (const p of sparks) {
        p.life += dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vx *= 0.96
        p.vy *= 0.96
        const tn = p.life / p.maxLife
        const a = (1 - tn) * 0.9
        ctx.beginPath()
        ctx.fillStyle = `rgba(240, 246, 255, ${a})`
        ctx.shadowColor = 'rgba(220, 232, 255, 0.95)'
        ctx.shadowBlur = 6
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      ctx.restore()

      if (hovering || glow > 0.01 || sparks.length) {
        raf = requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        raf = 0
      }
    }
    const start = () => {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    const enter = () => {
      hovering = true
      if (!reduced) start()
    }
    const leave = () => {
      hovering = false
    }
    const down = (e: PointerEvent) => {
      const r = btn.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      if (!reduced) {
        for (let k = 0; k < 10; k++) {
          const a = Math.random() * Math.PI * 2
          const speed = 26 + Math.random() * 46
          sparks.push({
            x,
            y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            r: 0.8 + Math.random() * 1.2,
            life: 0,
            maxLife: 0.4 + Math.random() * 0.3,
          })
        }
        start()
      }
      if (rippleRef.current) {
        gsap.fromTo(
          rippleRef.current,
          { x, y, scale: 0, opacity: 0.5 },
          { scale: Math.hypot(w, h) / 10, opacity: 0, duration: 0.65, ease: 'mechOut', overwrite: true },
        )
      }
    }

    btn.addEventListener('pointerenter', enter)
    btn.addEventListener('pointerleave', leave)
    btn.addEventListener('pointerdown', down)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
      btn.removeEventListener('pointerenter', enter)
      btn.removeEventListener('pointerleave', leave)
      btn.removeEventListener('pointerdown', down)
    }
  }, [])

  return (
    <Link ref={btnRef} to={to} className="glass-btn" data-cursor="Enter" style={{ ['--i' as string]: i }}>
      <canvas ref={canvasRef} className="glass-fog" aria-hidden />
      <span className="glass-ripple" ref={rippleRef} aria-hidden />
      <span className="glass-index">{index}</span>
      <span className="glass-label">{label}</span>
      <span className="glass-arrow" aria-hidden>
        ↗
      </span>
    </Link>
  )
}
