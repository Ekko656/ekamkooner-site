/* ============================================================
   Quality tier.

   The site is built around a permanent WebGL canvas, stacked
   backdrop blurs and several per-frame canvas loops. On a machine
   with hardware acceleration turned off none of that is merely
   slower - WebGL falls back to a software rasteriser and every
   backdrop-filter is re-blurred on the CPU, so the page crawls.

   So the site asks the machine what it can do and picks a tier:

     high - everything, as designed
     low  - no blurs, no particle type, no smooth-scroll hijack,
            a cheaper canvas: still the same site, just not
            spending frames on the parts that only decorate it

   Two chances to land on `low`: a synchronous check at boot
   (software renderer, thin CPU, reduced motion), and a watchdog
   that demotes a machine that turns out to be struggling anyway.
   The tier is mirrored onto <html data-perf>, so the CSS half of
   the answer needs no JavaScript at the point of use.
   ============================================================ */

export type Tier = 'high' | 'low'

type State = {
  /** current tier; may drop from high to low while the page is open */
  tier: Tier
  /** false when the machine cannot give us a WebGL context at all */
  webgl: boolean
  /** the OS-level "don't animate" preference */
  reduced: boolean
}

/* Names software rasterisers report. SwiftShader is Chrome's fallback
   when acceleration is off or blocklisted, llvmpipe is Mesa's, and the
   Microsoft/Direct3D basic renderer is Windows' - these are exactly the
   machines this whole file exists for. */
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|generic renderer/i

function probeRenderer(): { webgl: boolean; software: boolean } {
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return { webgl: false, software: true }
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '') : ''
    const lose = gl.getExtension('WEBGL_lose_context')
    lose?.loseContext()
    return { webgl: true, software: SOFTWARE.test(name) }
  } catch {
    return { webgl: false, software: true }
  }
}

function initialTier(): State {
  if (typeof window === 'undefined') return { tier: 'high', webgl: false, reduced: false }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const { webgl, software } = probeRenderer()
  /* ?perf=low / ?perf=high forces a tier. The degraded site is otherwise
     only reachable by actually turning acceleration off, which makes it
     the one version of the page nobody ever looks at. */
  const forced = new URLSearchParams(window.location.search).get('perf')
  if (forced === 'low' || forced === 'high') return { tier: forced, webgl, reduced }
  /* a phone with eight small cores is not the target here; this is aimed
     at the desktop that reports two or four and no GPU */
  const thin = (navigator.hardwareConcurrency ?? 8) <= 4
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const lowMem = typeof memory === 'number' && memory <= 4
  const tier: Tier = reduced || software || !webgl || thin || lowMem ? 'low' : 'high'
  return { tier, webgl, reduced }
}

const state: State = initialTier()

const listeners = new Set<(t: Tier) => void>()

function apply() {
  document.documentElement.dataset.perf = state.tier
}

/** subscribe to tier changes; returns an unsubscribe */
export function onTier(fn: (t: Tier) => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function demote() {
  if (state.tier === 'low') return
  state.tier = 'low'
  apply()
  for (const fn of listeners) fn('low')
}

export const perf = {
  get tier() {
    return state.tier
  },
  get low() {
    return state.tier === 'low'
  },
  get webgl() {
    return state.webgl
  },
  get reduced() {
    return state.reduced
  },
}

/* ---- the watchdog ----
   Boot-time detection misses a machine that is accelerated but simply
   slow, or one throttled by whatever else the user has open. So watch
   real frames for a few seconds: if the page cannot hold a reasonable
   rate, drop the decoration rather than let it grind.

   Frames are only counted while the tab is actually visible. A hidden
   tab's requestAnimationFrame is throttled to almost nothing, which
   would read as a machine on its knees and demote every background
   tab the moment it was opened. */
export function startWatchdog() {
  if (state.tier === 'low') return
  /* an explicit ?perf=high means "show me the full site"; it should not
     be second-guessed by the very measurement it was used to override */
  if (new URLSearchParams(window.location.search).get('perf')) return
  const NEED = 90 // frames of evidence before deciding
  const SLOW = 24 // ms per frame; about 42fps
  let counted = 0
  let total = 0
  let last = performance.now()
  let raf = 0

  const tick = (now: number) => {
    const dt = now - last
    last = now
    /* a hidden tab, a tab-switch or a long stall (an STL load, a route
       change) is not evidence about the machine's steady-state speed */
    if (!document.hidden && dt < 200) {
      total += dt
      counted++
      if (counted >= NEED) {
        if (total / counted > SLOW) demote()
        return
      }
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}

apply()
