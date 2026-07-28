import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import './lib/eases'
import { session } from './lib/session'
import { perf } from './lib/perf'
import { loadSoundPref, press, release, tick } from './lib/sound'
import { preloadAssembly } from './scene/ArmAssembly'
import Stage from './scene/Stage'
import { Nav, ReadProgress } from './ui/Chrome'
import Landing from './pages/Landing'
import About, { bindAboutScroll } from './pages/About'
import Projects from './pages/Projects'
import Resume from './pages/Resume'
import Contact from './pages/Contact'

gsap.registerPlugin(ScrollTrigger)

function Shell() {
  const { pathname } = useLocation()
  const main = useRef<HTMLElement>(null)

  /* one Lenis + one animation context per page visit */
  useEffect(() => {
    window.scrollTo(0, 0)
    session.velocity = 0
    if (pathname !== '/about') {
      session.aboutProgress = 0
      session.assemblyTarget = 0
      session.assembly = 0
      session.cardPull = 0
      /* Also clear what the closing performance left behind. `session` is
         a module singleton, so leaving `cardTossed` true meant that on
         coming back to About the card's own safety net fired instantly
         and parked it in its resting spot — visible, mid-page, before the
         arm had even finished building. */
      session.cardTossed = false
      session.gripHold = false
      session.grip.active = false
    }

    /* Smooth scroll is a hijack: the wheel stops moving the page and
       starts feeding an interpolator that repositions it every frame. It
       feels like silk at sixty frames and like a stuck wheel at fifteen,
       so a machine that cannot hold the rate gets its native scroll back
       - which is the one thing on the page the compositor can still do
       well without help. */
    let lenis: Lenis | null = null
    let tick: ((time: number) => void) | null = null
    let onNativeScroll: (() => void) | null = null
    /* Both tiers, not just the smooth-scroll one. gsap's lag smoothing
       clamps a long frame to a short one, which means a page that
       stutters also runs its entrance in slow motion - and the About
       card's fallback is written assuming real elapsed time. */
    gsap.ticker.lagSmoothing(0)
    if (perf.low) {
      let lastY = window.scrollY
      let lastT = performance.now()
      onNativeScroll = () => {
        const now = performance.now()
        const dt = Math.max(now - lastT, 1)
        session.velocity = ((window.scrollY - lastY) / dt) * 16
        lastY = window.scrollY
        lastT = now
      }
      window.addEventListener('scroll', onNativeScroll, { passive: true })
    } else {
      lenis = new Lenis({ lerp: 0.1 })
      lenis.on('scroll', (e: { velocity: number }) => {
        session.velocity = e.velocity
        ScrollTrigger.update()
      })
      tick = (time: number) => lenis!.raf(time * 1000)
      gsap.ticker.add(tick)
    }

    const ctx = gsap.context(() => {
      /* page entrance: rise and settle */
      if (main.current) {
        gsap.fromTo(
          main.current,
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'mechOut' },
        )
      }
      /* the shared reveal vocabulary */
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'mechOut',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        })
      })
      gsap.utils.toArray<HTMLElement>('.mask-line').forEach((mask, i) => {
        const line = mask.querySelector('.reveal-line')
        if (!line) return
        gsap.to(line, {
          y: 0,
          duration: 1.1,
          ease: 'mechOut',
          delay: (i % 6) * 0.07,
          scrollTrigger: { trigger: mask, start: 'top 92%' },
        })
      })
      /* the landing entrance is choreographed in Landing.tsx, so that the
         name, the line under it and the doors share one clock */
      if (pathname === '/about') bindAboutScroll()
    }, main)

    return () => {
      ctx.revert()
      if (tick) gsap.ticker.remove(tick)
      lenis?.destroy()
      if (onNativeScroll) window.removeEventListener('scroll', onNativeScroll)
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [pathname])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      session.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      session.pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  /* ---- fetch the machine before it is asked for ----

     The About page's arm is ~15MB of STL that has to be fetched,
     welded and shaded. Doing all of that at the moment the reader
     clicks About is what made it hang for a beat before appearing.

     So it starts in the background instead, from whatever page they
     are already on, once the browser has a spare idle slot and the
     current page has finished settling. It runs at most once per
     session — preloadAssembly() caches its own promise — and the About
     page simply awaits the same promise when it mounts, so nothing is
     duplicated and nothing about the result is downgraded to get here.

     Skipped on the low tier, where the arm is the last thing that
     machine needs speculatively chewing on, and skipped on About
     itself, where the component is about to ask for it anyway. */
  useEffect(() => {
    if (perf.low || pathname === '/about') return
    const idle: (cb: () => void) => number =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback ??
      ((cb) => window.setTimeout(cb, 1200))
    const id = window.setTimeout(() => idle(() => void preloadAssembly()), 1500)
    return () => window.clearTimeout(id)
  }, [pathname])

  /* ---- the clicks ----
     Delegated once at the document rather than wired into every button,
     so anything pressable anywhere on the site sounds the same without
     each component having to remember to ask for it.

     pointerdown and pointerup are separate sounds on purpose: a switch
     does not make the same noise going down as it does coming back, and
     hearing the release land is most of what makes it feel tactile
     rather than like a notification. The hover tick only fires when the
     pointer crosses onto a NEW target, or sweeping across a nav would
     machine-gun it. */
  useEffect(() => {
    loadSoundPref()
    const LIVE = 'a, button, input, .oc-list li, .sheet-stack li'
    let lastHover: Element | null = null

    const hit = (e: Event) => {
      const t = e.target
      return t instanceof Element ? t.closest(LIVE) : null
    }
    const onDown = (e: Event) => {
      if (hit(e)) press()
    }
    const onUp = (e: Event) => {
      if (hit(e)) release()
    }
    const onOver = (e: Event) => {
      const el = hit(e)
      if (el && el !== lastHover) {
        lastHover = el
        tick()
      } else if (!el) {
        lastHover = null
      }
    }
    /* keyboard users get the press too, on the thing they activate */
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      const el = document.activeElement
      if (el && el.matches(LIVE)) press()
    }

    document.addEventListener('pointerdown', onDown)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointerover', onOver)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  /* The 3D stage exists for one reason — the arm — so it is only
     mounted where the arm is. Every other page is paper and type, and
     pays nothing for a renderer it does not use. */
  const onAbout = pathname === '/about'

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {onAbout && <Stage showArm />}
      <main id="main" ref={main}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Nav />
      {pathname !== '/' && <ReadProgress />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}
