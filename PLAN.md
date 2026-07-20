# Open work plan

Running backlog for ekamkooner.com. Ekam should not have to repeat an item
that is written here. Tick items off only after verifying in the live
preview at 1280x800 (laptop aspect), never from code alone.

Last updated 2026-07-20, after commit `ed5251d`.

---

## 1. Landing page

- [x] **Particle name** — kept on the name only. A full star-dim palette
  made the type unreadable, so only the tint varies now while every mote
  stays high in the brightness range.
- [x] **Sub-line particles** — tried and reverted. At body size the motes
  were unreadable; the description is real text again with a rise-in.
- [x] **Shift the block right** and align the name, description and keys
  on one edge (all at x=141; the canvas is pulled back by its drawing pad).
- [x] **Keys smaller and less plain at rest** — top-lit gradient, bright
  inner top edge, soft drop.
- [x] **One entrance clock** — name gathers, line rises, keys walk in, and
  the robot fades on the same rise, ease and duration.

## 2. About page

- [x] **Scroll animation with real character** — lines split into words
  that cascade in from blur as they enter.
- [x] **More space between sections** — beats 72vh (tall 84vh), 5vh padding.
- [x] **Run-up at the two side flips** — 46vh lead-in so the machine has
  empty scroll to cross the frame in. Camera re-measured and retimed.
- [x] **The closing card pull rebuilt as a real lift.** The card hangs from
  the claw's projected screen position through a weighted spring: waits
  below the frame, gets grabbed at 0.45 of the gesture, gets hauled up
  lagging and swaying, ends fully in frame. Verified at 1280x800.
- [ ] **Framing trade-off for Ekam's eyes:** in the final hold, most of the
  arm body sits above the frame - the claw and card carry the shot. If he
  wants more machine visible, the LIFT pose has to hold the claw further
  out to the side instead of high (re-solve in
  `scripts/arm-pose-probe.mjs`), since the card needs ~440px below the
  claw. Also worth his eyes: the soft-line tracking breathe, the orbiting
  first swap.

## 3. Contact page

- [x] **Everything above "Let's build" removed**, all centred.

## 4. Projects page popup — media

- [x] **Videos not centred** — fixed, frame is centred in its column.
- [x] **No sound** — fixed. A sound toggle appears only on clips that
  actually carry an audio track. `ubc-bionics.mp4` and `claw.mp4` have
  audio; `arm-sim.webm` has no audio stream at all, so it correctly
  shows no control.
- [x] **Wrong aspect ratios / grey bars** — fixed. The frame takes the
  media's real aspect from its natural size, so nothing letterboxes.
- [ ] **HoneyKey has no video — blocked, needs Ekam.** This is not a bug in
  the code. `src/data/projects.ts` declares HoneyKey as `type: 'image'`
  pointing at `honeykey.png`, and there is no HoneyKey video anywhere in
  `public/projects`. The asset does not exist. Barrage, VEX and the RC car
  are stills for the same reason. **Need the video file** (or confirmation
  that a still is intended), then switch the entry to `type: 'video'`.

## 5. Audio, later

- [ ] **Quality of life sound effects.** Small, restrained cues: button
  hover and press on the landing keys, popup open and close, the arm's
  lock-in pulse on About. Must obey the restraint rule — subtle, never
  cartoonish, and never fired on page load.
- [ ] **Subtle background music** fitting the site's theme (dark, technical,
  spacious). Off by default with a visible, persistent mute control;
  browsers block autoplay with sound anyway, so it needs a deliberate
  user gesture to start. Remember the choice across pages.

---

## Standing rules that keep getting hit

- Verify at **1280x800**, the laptop aspect, not the default pane size.
- The arm's STLs take ~15s to load; a bare screenshot before that is a
  loading artifact, not a bug.
- Full rules live in `CONTEXT.md` section 2. The big ones: no thin elements,
  no AI-tell copy, two text sizes in About, emphasis is rare, everything
  intentional, commit and push often.
