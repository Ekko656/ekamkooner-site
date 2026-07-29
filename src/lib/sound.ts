/* ============================================================
   The clicks.

   Every sound on this site is synthesised here, at the moment it is
   played. There are no audio files: a good click is about four
   milliseconds of transient and forty of decay, and shipping that as a
   downloaded asset costs more than generating it.

   The feel we are after is a fidget toy — the small mechanical snap of
   a switch — which is two things layered:

     a TRANSIENT, a very short burst of noise pushed through a narrow
     bandpass. This is the part your ear reads as "click"; without it a
     tone just sounds like a beep.

     a BODY, a triangle tone that drops in pitch as it decays. This is
     the part that gives it size, and dropping the pitch is what makes
     it feel like something physically seating rather than a bleep.

   Rules this file keeps:
     - Nothing is ever heard on page load. The AudioContext is not even
       built until the first real gesture, which also happens to be
       what browsers require.
     - ONE sound per click, on the way down. There used to be a second,
       brighter sound on the way up, which is what a real switch does —
       but the gap between down and up is set by how the reader clicks,
       not by us. A trackpad tap fires them ~15ms apart and they fuse
       into one blurred noise; a deliberate press separates them into
       two. Same click, two different results. A single sound on
       pointerdown is the same every time.
     - It can be switched off, and the choice is remembered.
   ============================================================ */

const STORE_KEY = 'ek-sound'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null
let enabled = true

/* the mute state has to survive a reload, and has to be readable before
   any audio exists so the toggle can render in the right state */
export function soundEnabled(): boolean {
  return enabled
}

export function setSoundEnabled(on: boolean) {
  enabled = on
  try {
    localStorage.setItem(STORE_KEY, on ? '1' : '0')
  } catch {
    /* private mode: the preference just will not persist */
  }
}

export function loadSoundPref() {
  try {
    enabled = localStorage.getItem(STORE_KEY) !== '0'
  } catch {
    enabled = true
  }
}

/* One second of white noise, generated once and reused for every
   transient. Each click plays a few milliseconds of it from a random
   offset, so no two clicks are bit-identical — a perfectly repeating
   click is the thing that starts to grate. */
function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (noise) return noise
  const buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  noise = buf
  return buf
}

function audio(): AudioContext | null {
  if (!enabled) return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 0.5
    /* a gentle roll-off up top: the raw transient is bright enough to
       be brittle on laptop speakers */
    const soften = ctx.createBiquadFilter()
    soften.type = 'lowpass'
    soften.frequency.value = 7200
    master.connect(soften)
    soften.connect(ctx.destination)
  }
  /* browsers park the context until a gesture; the click that got us
     here is that gesture */
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

type Shape = {
  /* body pitch in Hz, and where it falls to */
  freq: number
  drop: number
  /* seconds */
  dur: number
  level: number
  /* how much of the transient to mix in, and how bright it is */
  snap: number
  snapHz: number
}

function play(s: Shape) {
  const ac = audio()
  if (!ac || !master) return
  const t = ac.currentTime

  /* --- the transient --- */
  const src = ac.createBufferSource()
  src.buffer = noiseBuffer(ac)
  const buf = src.buffer
  if (buf) src.playbackRate.value = 1
  const bp = ac.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = s.snapHz
  bp.Q.value = 1.1
  const ng = ac.createGain()
  ng.gain.setValueAtTime(s.snap * s.level, t)
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.018)
  src.connect(bp)
  bp.connect(ng)
  ng.connect(master)
  const from = Math.random() * 0.4
  src.start(t, from, 0.03)
  src.stop(t + 0.03)

  /* --- the body --- */
  const osc = ac.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(s.freq, t)
  osc.frequency.exponentialRampToValueAtTime(s.drop, t + s.dur)
  const og = ac.createGain()
  og.gain.setValueAtTime(0.0001, t)
  /* a 3ms attack rather than an instant one: a hard edge on a tone
     reads as a digital pop */
  og.gain.exponentialRampToValueAtTime(s.level, t + 0.003)
  og.gain.exponentialRampToValueAtTime(0.0001, t + s.dur)
  osc.connect(og)
  og.connect(master)
  osc.start(t)
  osc.stop(t + s.dur + 0.02)
}

/* the click, on the way down. The only one. */
export const press = () =>
  play({ freq: 380, drop: 190, dur: 0.055, level: 0.16, snap: 0.5, snapHz: 2100 })

/* the smallest one, for passing over something live. Nudged up from
   0.028: it was so far under the press that it read as almost nothing.
   Still well below the click, which is the point — a hover is not an
   event, it is a hint that something is live. */
export const tick = () =>
  play({ freq: 900, drop: 820, dur: 0.018, level: 0.06, snap: 0.3, snapHz: 4200 })
