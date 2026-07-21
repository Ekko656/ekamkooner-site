/* Resume: the actual pages rendered full width onto the page, so the
   page itself scrolls. No embedded viewer, no inner scrollbars. */
import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerSrc

export default function Resume() {
  const holder = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    const el = holder.current
    if (!el) return

    const render = async () => {
      try {
        const pdf = await getDocument({ url: new URL('/resume.pdf', window.location.origin).href }).promise
        if (cancelled) return
        el.innerHTML = ''
        const width = Math.min(el.clientWidth, 900)
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n)
          if (cancelled) return
          const base = page.getViewport({ scale: 1 })
          const scale = width / base.width
          const viewport = page.getViewport({ scale: scale * dpr })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.width = `${width}px`
          canvas.style.height = `${(viewport.height / viewport.width) * width}px`
          canvas.className = 'resume-page'
          el.appendChild(canvas)
          /* pdfjs v5 wants the canvas itself alongside the context */
          await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise
        }
        if (!cancelled) setState('done')
      } catch (err) {
        console.warn('resume render failed:', err)
        if (!cancelled) setState('error')
      }
    }
    render()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page page-resume">
      <header className="page-head">
        <p className="section-index reveal">
          <span className="index-num">03</span> Resume
        </p>
        <h1 className="page-title">
          <span className="mask-line">
            <span className="reveal-line">The short version, on paper.</span>
          </span>
        </h1>
        <a className="resume-download link-wipe reveal" href="/resume.pdf" download="Ekam-Kooner-Resume.pdf" data-cursor="Save">
          Download PDF
        </a>
      </header>
      <div className="resume-pages" ref={holder} />
      {state === 'loading' && <p className="resume-note">Loading the paper</p>}
      {state === 'error' && (
        <p className="resume-note">
          The preview did not load. The download above still works.
        </p>
      )}
    </div>
  )
}
