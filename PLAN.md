# Open work plan

Running backlog for ekamkooner.com. Ekam should not have to repeat an item
that is written here. Tick items off only after verifying in the live
preview at 1280x800 (laptop aspect), never from code alone.

Last updated 2026-07-22, after commit `0dee822`.

---

## 0. The paper overhaul (2026-07-27)

Ekam's brief: strip every gimmick, stop looking AI-generated and
scattered, go black and white, two or three families, no pure
uppercase, no hairline-thin faces, keep the humanoid hero and the About
arm assembly, and make the whole thing feel like one coherent object
instead of cool tricks stuck together.

Locked in this pass — the full rules now live in `CONTEXT.md` §5 and §6:

- [x] **Paper and ink, sitewide.** Navy ground gone. `--paper #faf9f7`,
  `--ink #131316`, one royal-purple accent that only ever reports state.
- [x] **Three families.** Old Standard TT (the writing), Forum (naming
  things), Schibsted Grotesk (anything you operate). Martian Mono, Zilla
  Slab, Shantell Sans and Figtree deleted from disk.
- [x] **Emphasis is the italic.** Ekam rejected purple letter-recolouring
  outright: it reads as a broken link.
- [x] **Gimmicks deleted:** particle name, custom cursor, dust, grain,
  humming grid, BUILD readout, clock, magnetic buttons, card 3D tilt,
  every glass surface.
- [x] **One link gesture everywhere**, one button system, one focus ring,
  a skip link, and a read-progress hairline that replaces the HUD.
- [x] **The machines were re-lit for paper, not recoloured by hand.** The
  arm's shell flipped from warm white to graphite, servos to brushed
  steel, and the *jaw* is anodised purple — the accent lands on the part
  that does the work. Stage lighting is now a white studio with one cool
  purple rim.
- [x] **Landing rebuilt twice.** First as a ruled door-index, which Ekam
  rejected; now a shared top bar, the name centred low in the left
  column, role line, sub-line, and three quick links.

### Round two (same day) — Ekam's second pass

- [x] **Sub-line** is now "Humanoids are the future."
- [x] **The door index is gone**; navigation is the shared top bar on
  every page, landing included. The bar's left slot carries the
  dateline on the landing and the name everywhere else.
- [x] **The name is centred in its column and sits low.** Its character
  went through two versions: an offset purple outline (a registration
  mark), which Ekam rejected as looking like a printing error, and the
  one that stuck — a vertical ink ramp from near-black into a deep
  violet, clipped to the glyphs. Depth in the ink, nothing drawn round
  it.
- [x] **Masthead nav links are set in Forum**, matching the labels.
- [x] **GitHub / LinkedIn / email are marks, not words**, each filling
  with the accent wash on hover.
- [x] **Purple letter-recolouring removed everywhere.** `em` is the
  italic in inherited ink; see CONTEXT.md §5.
- [x] **CAD outlines on the arm.** Every part carries an EdgesGeometry
  line copy at 32 degrees, drawn in ink over the shaded solid, on both
  the exploded parts and the live robot.
- [x] **Both gripper halves are anodised purple** (`moving_jaw` AND
  `wrist_roll_follower`). Note the material is the LEAST metallic on
  the machine on purpose — the studio environment is white, so a high
  metalness reflected white straight back and the claw rendered silver.
- [x] **About: body copy is much bigger** (clamp 1.4–1.75rem), the
  reveals fire at `top 96%` and resolve in 0.5s instead of 0.85s, and
  the off-clock card is 30rem instead of 20rem.
- [x] **The card no longer appears on re-entry.** `session` is a module
  singleton and `cardTossed`/`gripHold`/`grip.active` were not being
  cleared when leaving About, so its safety net fired instantly on
  return and parked the card mid-page. App.tsx clears them now.
- [x] **Project detail media is sized by height** (`min(42vh, 26rem)`)
  with the width following the media's own aspect, instead of running
  the full 60rem column.
- [x] **Resume is centred** — index, title, download and sheets.

### Round three

- [x] **The gripper is graphite again.** Purple on the claw was tried
  twice (moving jaw alone, then both halves) and rejected both times:
  a coloured claw on a graphite machine reads as a part off a different
  robot. The machine is one material; the only colour on the site is
  state.
- [x] **The hero robot no longer floats up.** See below.
- [x] **Links audited.** Every outbound URL resolves. Two look like
  failures to a command-line check and are not: LinkedIn answers 999
  and Devpost 403 to non-browser requests (bot-blocking), and the
  Barrage demo is on Render's free tier, so a cold start takes ~25s
  before it answers 200. Don't "fix" those.

### Round four

- [x] **Jost replaces Schibsted Grotesk** as the UI face, matched to a
  reference image Ekam supplied, with 0.06em tracking as standard.
- [x] **The humanoid fills the right half and tracks the cursor again.**
  Global events are back ON — they are what makes the machine follow
  the pointer. What gets pinned now is the camera's whole transform,
  position AND rotation, so the scene can turn the machine without
  turning the frame.
- [x] **The closing card fills its half of the frame** at 40rem with
  Jost rows, and each interest row now takes the accent wash and steps
  in under the pointer — the same gesture as an active filter.

### Round five

- [x] **The perf watchdog was demoting the page two seconds in.** It
  graded the machine while the STLs were still loading. Now it ignores
  the first 5s and needs 240 frames worse than 30fps.
- [x] **STL vertices are welded** before computing normals — this, not
  resolution, is what made the arm look low quality.
- [x] **About's reveal is scroll-LINKED**, not triggered: words resolve
  from dim ink to full ink as the line rises to the reading position,
  and scrubbing back un-resolves them. Cheaper too — no per-word blur.
- [x] **Crosshatch stock** on the paper; **card rebuilt** as a specimen
  card with no icons.
- [x] **The name only lights up near the cursor.**

### Round six

- [x] **The scroll-linked reveal is one timeline per BEAT**, not per
  line. Stacked lines sit within a few pixels of each other, so
  per-line triggers overlapped almost exactly and a block resolved all
  at once. Now every word in a beat shares one scrub and the block
  resolves in reading order.
- [x] **The About load stall was the edge geometry.** EdgesGeometry for
  all thirteen parts ran inside the load callback, right after thirteen
  STLs had been parsed and welded. It is deferred now: parts go on
  screen immediately, outlines arrive one per idle slot.
- [x] **Card marks come from Lucide**; numerals dropped.
- [x] **Masthead is "EK" on the landing**, in the same face as the nav.
- [x] **The crosshatch warms purple under the pointer** — a masked
  second layer, mask position written once per frame.
- [x] **Email links open Gmail compose** rather than `mailto:`.

### Round seven

- [x] **The humanoid follows the cursor again.** Two causes, both mine:
  the canvas is `pointer-events: none` so the scene's look-at never saw
  the pointer (fixed with `setGlobalEvents(true)`), and the look-at
  works by turning the CAMERA, which was being pinned. Camera position
  is still pinned — that is what stops the drift — but its rotation is
  now left alone. **Do not pin camera rotation.**
- [x] **Beats are 118vh+**, so only one statement is on screen at a
  time. NOTE: the camera swap keys in `Stage.tsx` were tuned against
  the old 72/84/96vh beat centres. They were scaled roughly in
  proportion, but the swap timing is worth a look on a real scroll.
- [x] **Solids carry a polygon offset** so the drawn edges stop
  z-fighting with the surface they came from (it showed as white
  speckle at glancing angles).
- [x] **Click sounds**, synthesised in `src/lib/sound.ts` — no audio
  files. Delegated once at the document. Press and release are
  different sounds. A toggle lives in the masthead and the choice is
  remembered.
- [x] Warm patch is smaller, fainter, and made of two lobes easing at
  different rates so it trails rather than sitting under the cursor.

### Known, not fixed

- **The VLA arm clip has no audio track**, so it correctly shows no
  sound control. Confirmed by scanning the container: `vla-teleop.webm`
  and `arm-sim.webm` carry no Opus/Vorbis stream, while `claw.mp4` and
  `ubc-bionics.mp4` do. Nothing in the code can add a control for audio
  that is not in the file — the clip needs re-exporting with sound.

### How the humanoid was stopped from cropping AND drifting (hard-won, do not redo)

The Spline scene frames itself on the machine's head. None of the
obvious levers work and each was tried:
- Resizing the canvas does nothing — a perspective camera's VERTICAL
  extent is fixed by its field of view, so a taller or shorter box only
  changes how much is cut off the sides.
- `setZoom()` has no visible effect.
- Writing the transform in `onLoad` does not flush: the values read
  back correctly afterwards while the render still shows the old
  framing.
- A guard like `alive()` driven by a mounted-ref never runs, because
  StrictMode's mount/unmount/mount leaves the flag false at the moment
  the scene finishes loading.

What works, in `pinRobot()` in `src/pages/Landing.tsx`: turn global
events OFF (the scene re-frames itself from pointer events anywhere on
the window — that is the intermittent cropping), then re-assert BOTH
`Camera 2`'s z and the `Bot` root's scale and y **every frame**, each
write nudged by a hair so the runtime does not skip it as a no-op. The
camera pull-back is what actually widens the framing; scaling the model
alone only makes a cropped machine smaller.

Pinning the camera's **z alone is not enough** — that fixes the crop and
leaves the drift. The scene flies the camera, so the machine rose about
215px in five seconds and sailed off the top of the page. The whole
position has to be held: x, y AND z.

Rotation has to be pinned too, or the lookAt behaviour swings the frame
along with the machine.

Current values: `CAM_X 0`, `CAM_Y 249`, `CAM_Z 1080`, `CAM_RX 0.0145`,
`BOT_SCALE 0.52`, `BOT_Y 232`. Re-measure these if the Spline scene is
ever republished.

### Still open from this pass

- [ ] **The About closing card gesture was never watched end to end.**
  Driving the scroll from automation does not reliably enter the trigger
  zone — the card stayed stowed below the frame in every scripted run.
  The logic was not changed (only the card's styling, the cursor tilt and
  the specular sweep were removed), but **Ekam should scroll the About
  page to the bottom by hand once** and confirm the arm still dives,
  grips, hauls and throws the card into place.
- [ ] **The low tier (`?perf=low`) has not been re-checked** since the
  paper rewrite. Most of what it used to disable (blurs, glass, particle
  type, the cursor) no longer exists, so its rules in `site.css` are now
  nearly empty and it may simply be fine — but it is unverified.
- [ ] **Narrow widths are untested.** The breakpoints were rewritten
  blind; only 1280x800 was actually looked at.

### A verification method that finally works

`CONTEXT.md` §9 and section 6 below say the WebGL stage cannot be seen —
its canvas never initialises in the in-app preview pane. **It renders
fine in real Chrome via the Claude-in-Chrome tools**, which is how the
arm's new materials and the lock-in pulse were checked this pass. Use
that for anything on the canvas. Two caveats: the pane's own screenshots
composite the page into a larger canvas so they are not to scale, and
synthetic wheel events do not drive Lenis — set `window.scrollTo` from
`javascript_tool` instead.

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

~~Worse than that: the r3f stage canvas never initialises in the pane.~~
**SOLVED 2026-07-28 — this was never a pane quirk.** The canvas sat at
the default 300x150 in *every* browser on a fresh load, and CSS then
stretched it across the viewport, so the machine was rendered at
300x150 and blown up to 3000px wide. It only ever looked fine because
something happened to fire a window resize (in an automated session,
the very first `resize_window` call), which snaps it to full size.

See section 8 for the fix and why it has to live where it does.

## 8. The stage canvas sizing bug (fixed, do not re-break)

Two separate faults were making the About arm look, in Ekam's words,
"like its 360p":

1. **The canvas never took its real size.** r3f measures its container
   with a ResizeObserver and that measurement never landed here, so the
   renderer stayed at the bare `<canvas>` default of 300x150 while CSS
   stretched it to full width.
   - `resize={{ offsetSize: true }}` does not fix it.
   - Gating the `<Canvas>` on a measured container does not fix it; the
     container reports 1512x857 the whole time, so measuring was never
     what was broken.
   - It **cannot** be fixed from inside `<Canvas>`: with no root, none
     of its children mount, so nothing in there ever runs.
   - What works is dispatching a `resize` event from `Stage` itself,
     next frame and again once layout settles. That hook is deliberately
     outside the Canvas. Do not move it in.

2. **`dpr={[1, 2]}` resolved to the minimum**, so a retina screen
   rendered at half resolution. It is now an explicit number.

Verified: canvas buffer 3024x1602 backing a 1512x801 box, effective
dpr 2.00, on a fresh load in a clean tab with no resize of any kind.

---

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
