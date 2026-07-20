# Open work plan

Running backlog for ekamkooner.com. Ekam should not have to repeat an item
that is written here. Tick items off only after verifying in the live
preview at 1280x800 (laptop aspect), never from code alone.

Last updated 2026-07-20, after commit `ed5251d`.

---

## 1. Landing page

- [ ] **Particle name: match the background stars more closely.** It settles
  into the letterforms correctly today, but while it is in particle form the
  motes do not read like the starfield behind them. Match the star layer's
  colour (`#9daccf`), size distribution and opacity range from
  `Starfield` in `src/scene/Stage.tsx`, so the name dissolves into the same
  sky rather than looking like a separate white effect.
- [ ] **Apply the same particle treatment to the sub-line.** "Biomedical
  Engineering student at UBC, aiming at humanoid robotics." gets the same
  TextFlow treatment as the name, at its own smaller scale.
- [ ] **Shift the whole landing text block slightly right.** `.landing-intro`
  margin-left, small nudge only.

## 2. About page

- [ ] **Scroll animations on the About text were never actually added.** The
  `.unblur` one-shot blur reveal exists, but the scroll-driven character
  Ekam asked for is still missing. This is outstanding, not done.
- [ ] **More space between every text section.** Increase the vertical gap
  between beats generally.
- [ ] **Extra space at the two side flips.** Where the text swaps sides
  (after "Another delivery app." and after "At the parent who needs an extra
  set of hands.") add more room still, so the camera and machine have empty
  scroll distance to travel across before any text arrives. Camera keys in
  `KEYS` in `src/scene/Stage.tsx` are timed to measured beat centres, so
  **re-measure the beat centres and retime `KEYS` after changing spacing.**

## 3. Contact page

- [ ] **Delete everything above "Let's build".** Remove the section index,
  the page title, whatever sits above it.
- [ ] **Centre everything** that remains.

## 4. Projects page popup — media is the worst area

- [ ] **Videos are not centred** in the detail popup.
- [ ] **Videos have no sound.** They are currently `muted`; give them audio
  with a user-facing control, since autoplay with sound is blocked.
- [ ] **Wrong aspect ratios / grey letterbox bars.** Size the media box to
  the actual video aspect instead of a fixed box.
- [ ] **The HoneyKey project has no video at all.** Find out whether the file
  is missing from `public/projects` or the entry in `src/data/projects.ts`
  points at a still. Fix so it plays like the others.

---

## Standing rules that keep getting hit

- Verify at **1280x800**, the laptop aspect, not the default pane size.
- The arm's STLs take ~15s to load; a bare screenshot before that is a
  loading artifact, not a bug.
- Full rules live in `CONTEXT.md` section 2. The big ones: no thin elements,
  no AI-tell copy, two text sizes in About, emphasis is rare, everything
  intentional, commit and push often.
