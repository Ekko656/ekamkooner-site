/* TextFlow: the name rendered as a particle system. Each glyph is
   sampled into hundreds of motes that hold the letterform when left
   alone, scatter away from the cursor as it passes, and spring back.
   Coloured and sized like the starfield behind it, so the name reads as
   part of the sky rather than a second effect layered on top. */
import { useEffect, useRef } from 'react'

type P = {
  hx: number
  hy: number
  x: number
  y: number
  vx: number
  vy: number
  r: number
  /* 0..1 across the name block, used to shade like the metal gradient */
  g: number
  tw: number
  ph: number
  delay: number
}

const LINES = ['EKAM', 'KOONER']
const REPEL_R = 118
const REPEL_F = 2600

export default function ParticleName() {
  const wrap = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const host = wrap.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let particles: P[] = []
    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    let last = 0
    let t0 = 0
    const pointer = { x: -9999, y: -9999 }

    /* sample the glyphs: draw the two lines to an offscreen canvas, then
       take a particle wherever the type is opaque */
    const build = () => {
      const cs = getComputedStyle(host)
      const fontSize = parseFloat(cs.fontSize) || 64
      const weight = cs.fontWeight || '700'
      const family = cs.fontFamily || 'sans-serif'
      const lineH = fontSize * 0.96
      const font = `${weight} ${fontSize}px ${family}`

      const off = document.createElement('canvas')
      const octx = off.getContext('2d', { willReadFrequently: true })
      if (!octx) return
      octx.font = font
      const widths = LINES.map((l) => octx.measureText(l).width)
      const textW = Math.max(...widths)
      /* the tracking in CSS is negative, so the drawn text is a touch
         wider than the styled text; pad rather than clip */
      const padX = fontSize * 0.1
      const padY = fontSize * 0.24
      w = Math.ceil(textW + padX * 2)
      h = Math.ceil(lineH * LINES.length + padY * 2)

      dpr = Math.min(window.devicePixelRatio || 1, 2)
      off.width = w * dpr
      off.height = h * dpr
      octx.scale(dpr, dpr)
      octx.font = font
      octx.textBaseline = 'alphabetic'
      octx.fillStyle = '#fff'
      LINES.forEach((line, i) => {
        octx.fillText(line, padX, padY + lineH * i + fontSize * 0.78)
      })

      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      canvas.width = w * dpr
      canvas.height = h * dpr

      const img = octx.getImageData(0, 0, off.width, off.height).data
      /* step in device pixels; smaller step = denser name */
      const step = Math.max(2, Math.round(2.2 * dpr))
      const next: P[] = []
      for (let py = 0; py < off.height; py += step) {
        for (let px = 0; px < off.width; px += step) {
          const a = img[(py * off.width + px) * 4 + 3]
          if (a < 128) continue
          const hx = px / dpr
          const hy = py / dpr
          next.push({
            hx,
            hy,
            /* fly in from a scattered cloud, like the starfield settling */
            x: hx + (Math.random() - 0.5) * w * 0.9,
            y: hy + (Math.random() - 0.5) * h * 2.2,
            vx: 0,
            vy: 0,
            r: 0.55 + Math.random() * 0.85,
            g: hy / h,
            tw: 0.8 + Math.random() * 2.4,
            ph: Math.random() * Math.PI * 2,
            delay: (hx / w) * 0.45 + Math.random() * 0.25,
          })
        }
      }
      particles = next
      t0 = performance.now() / 1000
    }

    const tick = (now: number) => {
      const ts = now / 1000
      const dt = Math.min((now - last) / 1000, 0.04)
      last = now
      const age = ts - t0

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.scale(dpr, dpr)

      for (const p of particles) {
        /* entrance: hold scattered until this mote's turn, then spring */
        const live = Math.min(1, Math.max(0, (age - p.delay) / 0.9))
        if (live > 0) {
          const k = 26 * live
          p.vx += (p.hx - p.x) * k * dt
          p.vy += (p.hy - p.y) * k * dt

          if (!reduced) {
            const dx = p.x - pointer.x
            const dy = p.y - pointer.y
            const d2 = dx * dx + dy * dy
            if (d2 < REPEL_R * REPEL_R) {
              const d = Math.sqrt(d2) || 0.001
              const f = (1 - d / REPEL_R) ** 2 * REPEL_F
              p.vx += (dx / d) * f * dt
              p.vy += (dy / d) * f * dt
            }
          }
          const damp = Math.exp(-7 * dt)
          p.vx *= damp
          p.vy *= damp
          p.x += p.vx * dt
          p.y += p.vy * dt
        }

        /* the metal gradient, carried per mote, plus a star twinkle */
        const g = p.g
        const lum = g < 0.32 ? 1 : g < 0.55 ? 0.86 : g < 0.72 ? 0.78 : 0.95
        const tw = reduced ? 1 : 0.82 + 0.18 * Math.sin(ts * p.tw + p.ph)
        const a = Math.min(1, live) * tw
        if (a <= 0.01) continue
        const R = Math.round(214 + 41 * lum)
        const G = Math.round(224 + 31 * lum)
        const B = Math.round(242 + 13 * lum)
        ctx.beginPath()
        ctx.fillStyle = `rgba(${R},${G},${B},${a * lum})`
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      pointer.x = e.clientX - r.left
      pointer.y = e.clientY - r.top
    }
    const onLeave = () => {
      pointer.x = -9999
      pointer.y = -9999
    }

    /* Rebuild only when the viewport actually changes size. Watching the
       host with a ResizeObserver would feed back forever: build() resizes
       the canvas, which resizes the host, which fires the observer. */
    let rebuildTimer = 0
    const onResize = () => {
      window.clearTimeout(rebuildTimer)
      rebuildTimer = window.setTimeout(build, 180)
    }
    const startAll = () => {
      build()
      last = performance.now()
      raf = requestAnimationFrame(tick)
      window.addEventListener('resize', onResize)
    }
    /* the glyph shapes must be sampled from the real face, not a
       fallback, or the name is rebuilt in the wrong letterforms */
    if (document.fonts?.ready) document.fonts.ready.then(startAll)
    else startAll()

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(rebuildTimer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <h1 className="landing-name" ref={wrap} aria-label="Ekam Kooner">
      <canvas ref={canvasRef} className="landing-name-canvas" aria-hidden />
    </h1>
  )
}
