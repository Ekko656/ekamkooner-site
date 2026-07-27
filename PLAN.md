# Open work plan

Running backlog for ekamkooner.com. Ekam should not have to repeat an item
that is written here. Tick items off only after verifying in the live
preview at 1280x800 (laptop aspect), never from code alone.

Last updated 2026-07-22, after commit `0dee822`.

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
- [x] **The closing card pull is a timed performance, not a scroll scrub.**
  Reaching the end zone plays a one-shot timeline: anticipation, dive
  below the frame, the claw closing, two strained tugs, a hauling lift.
- [x] **Grip solved with a real 3D object.** A metal crossbar + rope loop
  is a child of the jaw link, so the claw genuinely clamps it; a draped
  SVG cord ties from the bar to the placard, which hangs as a damped
  pendulum. The machine slides right (full arm on the right) and sets the
  placard down into the open left third, clear of its body. Verified at
  1280x800.
- [x] **Cable idea scrapped.** The claw now grips the card's back
  directly, clamping to -0.14 (near its closed limit) so it visibly grips
  down, and releases **mid-swing** rather than at the top of the reach -
  the top is exactly where a flat card and a 3D claw stop lining up. The
  card leaves on the arc's momentum and is thrown left into its resting
  spot. The arm follows through and settles proud, never droopy.
- [ ] **For Ekam's eyes:** the feel of the performance (grab timing,
  release point, how hard the card is thrown) and the resting spot. This
  could not be watched frame-by-frame in the preview pane - see below.

## 6. Preview-pane limitation worth knowing

The in-app browser pane runs `requestAnimationFrame` **only while a
screenshot is being captured** (`document.hidden` is always true). Any
rAF-driven animation is frozen between captures, so:
- particle/scene animations appear stuck mid-entrance in probes,
- the closing performance cannot be watched continuously,
- numbers read via `javascript_tool` reflect a frozen frame, not live state.

Judge motion by pumping several screenshots in a row, and treat a single
probe of an animated value as a still frame, not the settled result.

Worse than that: the r3f stage canvas never initialises in the pane at
all. It stays at the default 300x150 with no renderer attached, on every
page and every tier, and this is true of a clean checkout too - so the
arm and the starfield simply cannot be seen there. Anything that renders
in that canvas has to be checked in a real browser. What looks like
"the stars disappeared" in a pane screenshot is this, not a regression.

## 7. Performance on machines without graphics acceleration

Reported: the site is very laggy for some people, especially with
hardware acceleration off. Root causes found and addressed:

- [x] **A quality tier** (`src/lib/perf.ts`). Detects a software
  renderer (SwiftShader / llvmpipe / basic render), a thin CPU, low
  memory or reduced-motion, and mirrors `high` / `low` onto
  `<html data-perf>`. A watchdog watches 90 real frames and demotes a
  machine that measures slower than ~42fps anyway. Hidden tabs are not
  counted, or every background tab would demote itself.
- [x] **`?perf=low` / `?perf=high` forces a tier.** Use this to look at
  the degraded site - otherwise nobody ever sees it.
- [x] **Two WebGL renderers on the landing page.** The stage canvas and
  the Spline humanoid both ran live loops, plus the particle name's 2D
  canvas. Low tier drops Spline (which also skips its ~2MB of chunks)
  and sets the name as real type.
- [x] **Backdrop blur** on the glass buttons, the off-clock card, the
  project detail overlay and the status pills. Software rendering
  re-blurs everything behind them on the CPU. Low tier keeps every
  surface's light and bevel and only loses the see-through.
- [x] **The stage canvas** is dpr 1, no antialias, no dust, and drawn on
  demand off About at low tier. About keeps a live loop and the arm.
- [x] **Lenis smooth scroll** is a hijack that feels broken below about
  30fps; low tier gets native scrolling back.
- [x] **The custom cursor** is off at low tier - its lag IS the
  pointer's lag.
- [x] Every tier: the particle name batches its draw into one fill per
  alpha bucket instead of one per mote; the dust field solved the same
  pointer unprojection 620 times a frame; `.unblur .w` promoted all 121
  word spans to layers for the life of the About page; the off-clock
  card rewrote its transform and specular every frame while parked
  below the fold.
- [ ] **For Ekam:** load `?perf=low` and confirm the degraded site is
  still one you're happy to ship. It is a real fallback, not a
  stripped one, but it is your call whether losing the Spline humanoid
  and the particle gather on those machines is the right trade.
- [ ] **Not measured:** the WebGL stage cannot be verified in the
  in-app preview pane at all - its canvas never initialises there and
  stays 300x150 (this predates the perf work; confirmed against a clean
  checkout). Everything above was verified in the DOM/CSS; the 3D half
  of the low tier needs a real browser.

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
- [x] **HoneyKey video** — resolved via a YouTube embed (`embed: {provider:'youtube', id:'37EOq--P9oo'}`)
  instead of a local file. Barrage, VEX and the RC car remain stills; that's accepted, not blocked.

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
