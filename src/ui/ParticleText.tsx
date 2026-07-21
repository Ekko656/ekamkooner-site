/* TextFlow: type rendered as a particle system. Each glyph is sampled
   into motes that hold the letterform when left alone, scatter away from
   the cursor as it passes, and spring back.

   The motes are graded like the starfield behind them: most are dim and
   cool (#9daccf, the colour of the background stars), a few are brighter,
   and a handful burn white, each twinkling on its own slow cycle. The
   name reads as part of the same sky rather than a separate white effect
   sitting on top of it. */
import { useEffect, useRef, type ElementType } from 'react'

type P = {
  hx: number
  hy: number
  x: number
  y: number
  vx: number
  vy: number
  r: number
  /* star grading */
  cr: number
  cg: number
  cb: number
  a: number
  tw: number
  ph: number
  delay: number
}

type Props = {
  lines: string[]
  label: string
  as?: ElementType
  className?: string
  /* device-pixel gap between samples; smaller is denser */
  step?: number
  /* how far the cursor pushes, in CSS px */
  repel?: number
  /* seconds to wait before the motes start gathering, so the entrance
     can be placed on the same clock as the rest of the page */
  delay?: number
}

/* the two background star layers, for reference:
   colour #9daccf at opacity .32 and .18 */
const STAR = { r: 157, g: 172, b: 207 }

export default function ParticleText({
  lines,
  label,
  as: Tag = 'div',
  className = '',
  step = 2.2,
  repel = 118,
  delay = 0,
}: Props) {
  const wrap = useRef<HTMLElement>(null)
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
    const REPEL_F = repel * 22

    const build = () => {
      const cs = getComputedStyle(host)
      const fontSize = parseFloat(cs.fontSize) || 64
      const weight = cs.fontWeight || '700'
      const family = cs.fontFamily || 'sans-serif'
      const lh = parseFloat(cs.lineHeight)
      const lineH = Number.isFinite(lh) ? lh : fontSize * 1.2
      const font = `${weight} ${fontSize}px ${family}`

      const off = document.createElement('canvas')
      const octx = off.getContext('2d', { willReadFrequently: true })
      if (!octx) return
      octx.font = font
      const textW = Math.max(...lines.map((l) => octx.measureText(l).width))
      /* pad so nothing clips, then pull the canvas back by the same
         amount below, so the glyphs still start on the block's left edge
         and line up with everything else in the column */
      const padX = Math.ceil(fontSize * 0.1)
      const padY = Math.ceil(fontSize * 0.28)
      w = Math.ceil(textW + padX * 2)
      h = Math.ceil(lineH * lines.length + padY * 2)

      dpr = Math.min(window.devicePixelRatio || 1, 2)
      off.width = w * dpr
      off.height = h * dpr
      octx.scale(dpr, dpr)
      octx.font = font
      octx.textBaseline = 'middle'
      octx.fillStyle = '#fff'
      lines.forEach((line, i) => {
        octx.fillText(line, padX, padY + lineH * i + lineH / 2)
      })

      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      canvas.style.marginLeft = `${-padX}px`
      canvas.style.marginTop = `${-padY}px`
      canvas.style.marginBottom = `${-padY}px`
      canvas.width = w * dpr
      canvas.height = h * dpr

      const img = octx.getImageData(0, 0, off.width, off.height).data
      const gap = Math.max(2, Math.round(step * dpr))
      const next: P[] = []
      for (let py = 0; py < off.height; py += gap) {
        for (let px = 0; px < off.width; px += gap) {
          if (img[(py * off.width + px) * 4 + 3] < 128) continue
          const hx = px / dpr
          const hy = py / dpr
          /* Solid white type that happens to be built from motes. The
             tint barely varies and the sizes stay close together, so it
             reads as clean lettering rather than a field of glitter. */
          const mix = 0.94 + Math.random() * 0.06
          const a = 0.97 + Math.random() * 0.03
          const r = 0.72 + Math.random() * 0.16
          next.push({
            hx,
            hy,
            x: hx + (Math.random() - 0.5) * w * 0.85,
            y: hy + (Math.random() - 0.5) * h * 2,
            vx: 0,
            vy: 0,
            r: r * (fontSize > 40 ? 1 : 0.78),
            cr: Math.round(STAR.r + (255 - STAR.r) * mix),
            cg: Math.round(STAR.g + (255 - STAR.g) * mix),
            cb: Math.round(STAR.b + (255 - STAR.b) * mix),
            a,
            /* stars twinkle slowly and out of step with each other */
            tw: 0.35 + Math.random() * 1.1,
            ph: Math.random() * Math.PI * 2,
            delay: delay + (hx / Math.max(1, w)) * 0.4 + Math.random() * 0.22,
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
        const live = Math.min(1, Math.max(0, (age - p.delay) / 0.9))
        if (live > 0) {
          const k = 26 * live
          p.vx += (p.hx - p.x) * k * dt
          p.vy += (p.hy - p.y) * k * dt

          if (!reduced) {
            const dx = p.x - pointer.x
            const dy = p.y - pointer.y
            const d2 = dx * dx + dy * dy
            if (d2 < repel * repel) {
              const d = Math.sqrt(d2) || 0.001
              const f = (1 - d / repel) ** 2 * REPEL_F
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

        /* almost no twinkle: just enough that the letters are alive, far
           too little to glint like a disco ball */
        const tw = reduced ? 1 : 0.985 + 0.015 * Math.sin(ts * p.tw + p.ph)
        const alpha = live * p.a * tw
        if (alpha <= 0.01) continue
        ctx.beginPath()
        ctx.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},${alpha})`
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

    /* Rebuild only on a real viewport change. Watching the host with a
       ResizeObserver feeds back forever: build() resizes the canvas,
       which resizes the host, which fires the observer. */
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
    /* sample from the real face, not a fallback, or the type is rebuilt
       in the wrong letterforms */
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
  }, [lines, step, repel, delay])

  return (
    <Tag className={className} ref={wrap} aria-label={label}>
      <canvas ref={canvasRef} className="particle-canvas" aria-hidden />
    </Tag>
  )
}
