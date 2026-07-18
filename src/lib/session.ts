/* ============================================================
   Shared state spine between the DOM and the WebGL scene.
   The About page owns the assembly: its scroll progress writes
   the build target and the scene chases it smoothly.
   ============================================================ */

class Session {
  /** continuous build target written by the About page scroll, 0..1 */
  assemblyTarget = 0
  /** smoothed build progress the scene is showing, 0..1 */
  assembly = 0
  /** About page scroll progress, drives the camera orbit path */
  aboutProgress = 0
  /** whether the arm should be on stage at all */
  armVisible = false
  /** page scroll velocity, for the grid hum */
  velocity = 0
  /** pointer in normalized device coords */
  pointer = { x: 0, y: 0 }
}

export const session = new Session()
