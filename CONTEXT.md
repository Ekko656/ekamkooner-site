# ekamkooner.com rebuild — full context

Handoff document. Read this top to bottom before touching anything.
Last updated 2026-07-19.

---

## 0. Where things stand right now

**Repo:** `~/ekamkooner-site` → `github.com/Ekko656/ekamkooner-site` (public, branch `main`).
Latest pushed commit: `26b264d`.

**Run it:** the dev server is started through the preview tool, config name
`ekamsite`, port **5175** (`~/.claude/launch.json`, runs `npm --prefix
ekamkooner-site run dev`). It serves at `http://localhost:5175`. It has been
stopped accidentally more than once — if the page is blank, check the server is
actually running before debugging anything else.

**Stack:** Vite + React 19 + TypeScript, react-router-dom, GSAP (ScrollTrigger,
CustomEase), Lenis smooth scroll, three.js + @react-three/fiber + drei,
urdf-loader + STLLoader, @splinetool/react-spline, pdfjs-dist.

---

## 1. The project

Ekam Kooner is a Biomedical Engineering (Robotics) student at UBC aiming at
humanoid robotics. This is a rebuild of his portfolio, replacing the current
purple/light site at ekamkooner.com.

There is a **separate, older project** at `~/portfolio-3d` (an interactive 3D
garage scene with a workbench and an SO-ARM101). It is **deprioritised** — a
slow-burn side project. Do not work on it unless asked. Some assets were copied
from it (the SO-101 URDF + STLs).

**Design direction:** dark, near-black navy, technical but high-class and clean.
Not a designer's portfolio — an engineer's. Restraint is the flex. The original
blueprint is `~/Downloads/ekamkooner-site-plan.md` (design tokens, motion rules,
research library). It has been **heavily deviated from** based on Ekam's
feedback; where this document and the plan disagree, **this document wins**.

---

## 2. Non-negotiable rules (learned the hard way, repeatedly)

These come from direct, often frustrated feedback. Violating them wastes a whole
round.

1. **No thin elements.** 1px hairlines, thin rings, thin/light font weights read
   as "Claude default". Borders and rules are 2px+, fonts medium weight or above.
2. **No AI-language tells in copy.** No em dashes, slashes, brackets, mid-dots,
   or cryptic section labels. Section names are plain: About, Projects, Resume,
   Contact. ("DIRECTIVE", "SYSTEMS", "UPLINK" were explicitly rejected.)
3. **No low-detail primitive geometry.** Everything must look like the real
   object. Correct proportions, no clipping, no boxes standing in for things.
4. **Scroll choreography must be smooth and procedural,** never chunked. Section
   checkpoints are values the progress *passes through*, not jump cuts.
5. **Text must integrate with the 3D scene,** never sit as a static layer above
   it. Manage overlap deliberately — nothing unreadable, nothing on top of the
   arm.
6. **Typography: intentional hierarchy.** Exactly two text sizes in the About
   narrative. Not every line a different size. No tiny greyed-out body text — if
   it can't be read comfortably it's wrong.
7. **Emphasis is rare.** Highlighting many words in signal blue makes emphasis
   meaningless. One key phrase per section at most.
8. **Every decision intentional.** No filler, no decorative elements without a
   reason.
9. **Verify in the live preview before claiming something is fixed.** He has
   caught unverified claims repeatedly.
10. **Commit and push frequently** — he wants a green contribution graph.

---

## 3. Rejected ideas — do NOT re-propose

- **Cursor-tracking IK arm** as the hero. Tried before; a 3D arm on a 2D screen
  with a fixed camera reads wrong. Called "one of the two most basic forms".
- **Particle/dot silhouette arm** as the hero. Trope-adjacent, abstract, doesn't
  prove engineering skill.
- **Single-giant-scroll site.** Structure is multi-page (decided 2026-07-18).
- **Chapter labels** ("01 — The question") in About. Felt cluttered, removed.
- **Handwritten fonts** (Shantell Sans, Caveat) and Figtree in About. Rejected as
  incohesive / "google doc" feeling. Now one serif: **Zilla Slab**.
- **Headshot on the landing page.** Was squished in a corner; removed entirely.
  (`public/headshot.jpg` still exists if ever wanted back.)

---

## 4. Site structure

Multi-page with react-router. One persistent WebGL canvas behind the DOM that
never unmounts (`src/scene/Stage.tsx`).

| Route | File | What it is |
|---|---|---|
| `/` | `pages/Landing.tsx` | Name, one-line identity, 4 glass buttons, Spline humanoid on the right |
| `/about` | `pages/About.tsx` | The manifesto as scroll beats + the SO-101 assembling alongside |
| `/projects` | `pages/Projects.tsx` | Card board, search + category filters, detail popup |
| `/resume` | `pages/Resume.tsx` | Real PDF pages rendered onto the page via pdf.js |
| `/contact` | `pages/Contact.tsx` | Centred invitation + links |

The 3D arm only renders on `/about` (`<Stage showArm={pathname === '/about'} />`).

---

## 5. Design system

`src/styles/tokens.css`

- **Colour:** `--navy-950 #04060c` (near-black ground) → `--navy-600 #26314f`.
  Text `--ice-100/200/400/600`. One accent `--signal #6e8cff`, used sparingly.
- **Fonts (all self-hosted woff2 in `public/fonts`):**
  - `--font-display` **Schibsted Grotesk** — UI, landing, headings, chrome.
  - `--font-mono` **Martian Mono** — labels, readouts, indices.
  - `--font-serif` **Zilla Slab** — the About narrative voice. *This is the one
    Ekam approved.*
  - `--font-hand` (Shantell Sans) and `--font-story` (Figtree) are still declared
    but **no longer used** — safe to delete.
- **Motion:** one ease family in `src/lib/eases.ts` (`mech`, `mechOut`,
  `mechHeavy`, `mechSnap`), registered as GSAP CustomEase and referenced by name.

---

## 6. The hero (`/`)

- **Spline humanoid robot** on the right, from the 21st.dev "Splite" component:
  scene `https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode`. It tracks
  the cursor. Absolutely positioned, full page height, left and top edges masked
  so it dissolves into the ground rather than looking pasted on. Fades in only
  once `onLoad` fires. The legs being cut at the bottom of the viewport is
  expected and accepted.
- **Name** uses a brushed-metal gradient with `background-clip: text`. Important:
  the gradient must sit on `.landing-name .reveal-line` (the element that holds
  the glyphs), **not** on the parent — the masked-reveal wrappers break the clip
  otherwise, and the name renders invisible.
- **Buttons** are fluid-glass keys (`.glass-btn`): frosted translucent panel,
  backdrop blur, light sweep on hover, signal glow, index + arrow. Modelled on
  the Framer "fluid glass button". Deliberately small.
- Background: near-black, blue radial pool toned down and shifted up-right to
  match where the light hits the robot. **All vertical grid lines removed** (the
  `GridLines` component still exists in `ui/Chrome.tsx` but is no longer
  rendered).

---

## 7. The About page — the centrepiece

### The narrative
The manifesto from the current site, near-verbatim ("Who is engineering for?" …
"Everything I build comes back to that."). Invented bio lines ("Embedded firmware
with UBC Bionics", etc.) were **explicitly removed** — do not reintroduce them.

### Typography
One serif (Zilla Slab), two sizes only: `.a-lead` (statement) and `.a-body`
(everything else). `.a-soft` is the same size as body, just lighter with a signal
rule on the leading edge — never shrunken grey text.

### Reveal
`.unblur` — each line resolves from `blur(10px)` + rise as it enters. Two
gotchas, both already handled, don't regress them:
- It must be a **one-shot tween, not scrubbed**. Scrubbing a blur filter every
  frame alongside the WebGL canvas tanks performance.
- **Never use `clearProps: 'filter'`** — it strips the inline `blur(0)` and
  reverts to the CSS base blur, leaving text permanently blurry.
- Elements already on screen at load get no ScrollTrigger (they'd never fire),
  they just play on mount.

### Beat sides (Ekam's explicit instruction)
Text alternates so the arm always has the opposite half of the screen:
`left, left, left, right (trading algorithms), right, right, left (biomedical
engineering), left`. The arm therefore travels **right → left → right**.

### The arm assembly (`src/scene/ArmAssembly.tsx`)
- Real SO-ARM101 URDF + STLs in `public/so101`. 12 parts (the wide waveshare
  mounting plate is hidden).
- **Exploded state:** parts spread evenly over a flattened fibonacci sphere so
  they read as one diagram, all in view from the top of the page, with no two
  parts clipping. Note: the STLs take ~15s to load — an early screenshot showing
  no parts is a loading artifact, not a bug.
- **Assembly** is continuous and scroll-driven: `session.assemblyTarget = p/0.8`,
  so it completes at 80% of the page. Each part flies a quadratic bezier along
  its own outward ray so paths fan apart instead of crossing. Each part clicks
  home with a small settle pulse.
- **Completion:** at >99.5% the baked parts swap for the live articulated URDF,
  a lock pulse + expanding ring fires, and the machine wakes into slow airy joint
  drift.
- **Colours:** warm white printed shell, gunmetal servos, brushed steel base.
  **No blue on the machine** (explicitly requested).
- **The finished pose** must be the real SO-ARM101 rest stance — shoulder lifted,
  ~90° elbow bend, gripper reaching forward and slightly down toward the viewer,
  claw open. Reference: <https://huggingface.co/docs/lerobot/so101> (shoulder_lift
  −45°, elbow_flex +90°, gripper ~50%). It must **never stand vertically**.
- **The snap bug:** `CARD_REST` is aliased to `DISPLAY_POSE` on purpose. If they
  differ, the arm visibly jerks the instant the card gesture begins.

### The closing card pull (last 20% of scroll)
`session.cardPull` 0→1 drives, in sync:
- the arm through `CARD_REST → CARD_REACH → CARD_LIFT` (reach down out of frame,
  grab, lift),
- the camera settling square in front of the finished arm,
- the DOM off-clock card (`.oc-card`, fixed, left side) rising into place once
  pull > 0.45.

---

## 8. Projects, Resume, Contact

- **Projects:** categories are general — `Robotics | Software | Hardware` (a
  `category` field on each project, separate from the display `tag`). Plus a text
  search. Cards tilt toward the cursor and play their video on hover.
- **The popup must open at a fixed position from the top regardless of scroll.**
  This only works because the detail panel is **portaled to `document.body`** —
  the `main` element carries a GSAP transform, which makes `position: fixed`
  resolve against it instead of the viewport. Do not un-portal it.
  It scrolls natively inside itself (`data-lenis-prevent`, `overscroll-contain`).
- **Resume:** pdf.js renders every page as a canvas onto the page, so the page
  itself scrolls. No embedded viewer, no inner scrollbars. Centred.
  `getDocument({ url })` — pdfjs v5 rejects a bare string.
- **Contact:** everything centred.

**Media** for projects lives in `public/projects` (downloaded from the live
site): `arm-sim.webm`, `ubc-bionics.mp4`, `claw.mp4`, plus png/jpg stills.
`public/resume.pdf` is the real resume.

---

## 9. Verification gotchas (read before debugging)

The browser tooling fights this site. Symptoms that are **not real bugs**:

- **Scroll actions time out after 30s.** The tool waits for the page to "settle";
  the WebGL canvas animates forever so it never does. The scroll still happens —
  just take a screenshot afterwards and ignore the timeout.
- **Programmatic Lenis jumps (`scrollTo(..., {immediate: true})`) render black.**
  It desyncs the canvas/DOM. Real wheel scrolling works fine. Don't conclude the
  page is broken from this.
- **Stale console errors.** "Invalid hook call" appeared repeatedly from HMR
  artifacts after mid-session rewrites; a clean reload showed zero errors twice.
  Clear `node_modules/.vite` and hard reload before chasing one.
- **HMR doesn't re-run `useEffect`s** that set debug hooks on `window`, so a
  freshly added hook is often `undefined` until a full reload.
- The arm's STLs take **~15 seconds** to load. Wait before judging.

---

## 10. Open / unverified work

Everything below is **coded but not visually confirmed** — the deep-scroll state
of `/about` could not be reliably screenshotted for the reasons in §9. This is
the top priority for the next session, and it needs Ekam's eyes or a patient
manual scroll:

1. **The finished arm pose** — is it actually bent forward and clawing toward the
   viewer, not vertical?
2. **The right → left → right camera choreography** — does it move at a
   comfortable pace? Ekam previously said it shifted right "too fast".
3. **The arm's vertical position at the end** — he asked for it lower / properly
   in view.
4. **The card pull-up animation** — does the arm convincingly lift the off-clock
   card into place on the left?

Also outstanding: a **mobile/responsive pass**, and the landing "text-flow"
treatment Ekam linked (a flowing animated text effect). My judgment, which I owe
him honestly: continuously flowing letters on the name would read cluttered
against the classy metallic look; the current refined masked reveal plus metal
gradient is the better fit. He asked to be told if I thought so.

---

## 11. Related memory files

`~/.claude/projects/-Users-ekam/memory/`
- `ekamkooner-editorial-site.md` — this project's index entry, content inventory.
- `portfolio-3d-working-style.md` — the aesthetic bar and process rules (§2 here).
- `portfolio-3d-rebuild.md`, `portfolio-3d-interaction-vision.md` — the
  deprioritised 3D garage scene.
- `humanoid-arm-portfolio.md` — the MuJoCo arm project (the "Arm Sim" entry).
