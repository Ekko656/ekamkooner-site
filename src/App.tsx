import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import './lib/eases'
import { session } from './lib/session'
import { perf } from './lib/perf'
import Stage from './scene/Stage'
import Cursor from './ui/Cursor'
import { Grain, Nav, Readouts, Clock } from './ui/Chrome'
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
         name, the line under it and the keys share one clock */
      /* magnetic elements */
      gsap.utils.toArray<HTMLElement>('[data-magnetic]').forEach((el) => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'mechOut' })
        const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'mechOut' })
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          xTo((e.clientX - (r.left + r.width / 2)) * 0.08)
          yTo((e.clientY - (r.top + r.height / 2)) * 0.18)
        }
        const leave = () => {
          xTo(0)
          yTo(0)
        }
        el.addEventListener('pointermove', move)
        el.addEventListener('pointerleave', leave)
      })
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

  return (
    <>
      <Stage showArm={pathname === '/about'} />
      <main ref={main}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Nav />
      {pathname === '/about' && <Readouts />}
      <Clock />
      <Grain />
      <Cursor />
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
