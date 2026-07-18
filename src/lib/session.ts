/* ============================================================
   The machine session — one shared state spine.
   DOM sections and the WebGL scene both read/write here, so
   HTML and 3D stay in lockstep (single source of truth).
   ============================================================ */

export type SectionId = 'hero' | 'directive' | 'systems' | 'operator' | 'uplink'

export const SECTIONS: { id: SectionId; index: string; label: string }[] = [
  { id: 'hero', index: '00', label: 'SYSTEM' },
  { id: 'directive', index: '01', label: 'DIRECTIVE' },
  { id: 'systems', index: '02', label: 'SYSTEMS' },
  { id: 'operator', index: '03', label: 'OPERATOR' },
  { id: 'uplink', index: '04', label: 'UPLINK' },
]

/* assembly progress target per section checkpoint (0 = exploded, 1 = built) */
export const ASSEMBLY_TARGET: Record<SectionId, number> = {
  hero: 0,
  directive: 0.28,
  systems: 0.55,
  operator: 0.8,
  uplink: 1,
}

type Listener = (s: SectionId) => void

class Session {
  section: SectionId = 'hero'
  /** whole-page scroll progress 0..1 (written by Lenis) */
  scroll = 0
  /** live scroll velocity (written by Lenis) */
  velocity = 0
  /** REAL assembly timeline progress 0..1 (written by the scene each frame) */
  assembly = 0
  /** pointer in normalized device coords, for camera parallax + cursor */
  pointer = { x: 0, y: 0 }

  private sectionListeners = new Set<Listener>()

  setSection(id: SectionId) {
    if (id === this.section) return
    this.section = id
    this.sectionListeners.forEach((l) => l(id))
  }

  onSection(l: Listener) {
    this.sectionListeners.add(l)
    return () => this.sectionListeners.delete(l)
  }
}

export const session = new Session()
