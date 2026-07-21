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
  /** closing gesture 0..1: arm reaches down, lifts the off-clock card up
      and to the left. Scrubbed by the last stretch of the About scroll. */
  cardPull = 0
  /** whether the arm should be on stage at all */
  armVisible = false
  /** the claw tip projected into CSS pixels, written by the scene every
      frame while the machine is live. The About page pins the off-clock
      card to this point during the pull, so the card is physically
      attached to the claw instead of being choreographed beside it. */
  grip = { x: 0, y: 0, active: false }
  /** true from the frame the claw closes on the card until it lets go.
      While held, the card is rigidly attached to the grip point. */
  gripHold = false
  /** true once the closing performance is past the release point. The
      card watches this so it still lands if a stutter or a backgrounded
      tab made the whole grab-to-release window pass between two frames. */
  cardTossed = false
  /** page scroll velocity, for the grid hum */
  velocity = 0
  /** pointer in normalized device coords */
  pointer = { x: 0, y: 0 }
}

export const session = new Session()
