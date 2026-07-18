/* ============================================================
   The one ease family. Every animation on the site uses one of
   these four — that consistency IS the "controlled machine" feel.
   ============================================================ */
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)

/** primary: quick mechanical attack, weighted settle */
export const MECH = CustomEase.create('mech', '0.6, 0, 0.1, 1')
/** exits/reveals: fast out, long decelerating tail */
export const MECH_OUT = CustomEase.create('mechOut', '0.16, 1, 0.3, 1')
/** heavy moves (arm trajectories, camera): slower engage */
export const MECH_HEAVY = CustomEase.create('mechHeavy', '0.7, 0, 0.16, 1')
/** micro feedback (cursor, taps): near-linear snap */
export const MECH_SNAP = CustomEase.create('mechSnap', '0.4, 0, 0.2, 1')
