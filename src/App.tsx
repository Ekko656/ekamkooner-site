import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import './lib/eases'
import { session, type SectionId } from './lib/session'
import Stage from './scene/Stage'
import Cursor from './ui/Cursor'
import { GridLines, Grain, Nav, Readouts, Clock } from './ui/Chrome'
import { Hero, Directive, Systems, Operator, Uplink } from './sections/Sections'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    /* ---- smooth scroll backbone ---- */
    const lenis = new Lenis({ lerp: 0.1 })
    lenisRef.current = lenis
    lenis.on('scroll', (e: { progress: number; velocity: number }) => {
      session.scroll = e.progress
      session.velocity = e.velocity
      ScrollTrigger.update()
    })
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)

    /* ---- pointer for parallax + dust ---- */
    const onMove = (e: PointerEvent) => {
      session.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      session.pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove)

    /* ---- section checkpoints: crossing a boundary fires the machine ---- */
    const sections = gsap.utils.toArray<HTMLElement>('[data-section]')
    const triggers: ScrollTrigger[] = sections.map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 55%',
        onEnter: () => session.setSection(el.dataset.section as SectionId),
        onEnterBack: () => session.setSection(el.dataset.section as SectionId),
      }),
    )

    /* ---- reveals: one shared vocabulary everywhere ---- */
    gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'mechOut',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      })
    })
    gsap.utils.toArray<HTMLElement>('.mask-line').forEach((mask, i) => {
      const line = mask.querySelector('.reveal-line')
      if (!line) return
      gsap.to(line, {
        y: 0,
        duration: 1.1,
        ease: 'mechOut',
        delay: (i % 6) * 0.06,
        scrollTrigger: { trigger: mask, start: 'top 88%' },
      })
    })

    /* ---- magnetic CTA ---- */
    const magnets = gsap.utils.toArray<HTMLElement>('[data-magnetic]')
    const magnetCleanups = magnets.map((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'mechOut' })
      const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'mechOut' })
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        xTo(dx * 0.08)
        yTo(dy * 0.18)
      }
      const leave = () => {
        xTo(0)
        yTo(0)
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerleave', leave)
      return () => {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerleave', leave)
      }
    })

    return () => {
      window.removeEventListener('pointermove', onMove)
      triggers.forEach((t) => t.kill())
      magnetCleanups.forEach((c) => c())
      lenis.destroy()
    }
  }, [])

  const jump = (id: SectionId) => {
    lenisRef.current?.scrollTo(`#${id}`, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) })
  }

  return (
    <>
      <Stage />
      <GridLines />
      <main>
        <Hero />
        <Directive />
        <Systems />
        <Operator />
        <Uplink />
      </main>
      <Nav onJump={jump} />
      <Readouts />
      <Clock />
      <Grain />
      <Cursor />
    </>
  )
}
