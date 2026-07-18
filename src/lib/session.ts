/* ============================================================
   One shared state spine. DOM sections and the WebGL scene both
   read and write here so HTML and 3D stay in lockstep.

   Assembly is CONTINUOUS: scroll position maps smoothly onto
   build progress, and section checkpoints are simply the values
   that alignment passes through, never jump cuts.
   ============================================================ */

export type SectionId = 'hero' | 'why' | 'projects' | 'about' | 'contact'

export const SECTIONS: { id: SectionId; index: string; label: string }[] = [
  { id: 'hero', index: '00', label: 'Start' },
  { id: 'why', index: '01', label: 'Why' },
  { id: 'projects', index: '02', label: 'Projects' },
  { id: 'about', index: '03', label: 'About' },
  { id: 'contact', index: '04', label: 'Contact' },
]

/* build progress the scroll passes through at each section top */
export const ASSEMBLY_TARGET: Record<SectionId, number> = {
  hero: 0,
  why: 0.3,
  projects: 0.62,
  about: 0.86,
  contact: 1,
}

type Listener = (s: SectionId) => void

class Session {
  section: SectionId = 'hero'
  /** whole page scroll progress 0..1 */
  scroll = 0
  /** live scroll velocity */
  velocity = 0
  /** continuous build target from the scroll map, 0..1 */
  assemblyTarget = 0
  /** smoothed build progress the scene is actually showing, 0..1 */
  assembly = 0
  /** pointer in normalized device coords */
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
