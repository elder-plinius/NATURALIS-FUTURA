/**
 * audio.ts — the soundtrack of the latent world, synthesised at runtime.
 *
 * Every sound here is generated with the Web Audio API. Nothing is loaded from
 * disk: the repository carries no audio assets, the standalone edition stays a
 * single file, and the whole soundscape costs about 12KB of source.
 *
 * Signal path:
 *
 *   ambient voices ─┐
 *                   ├─→ musicBus ─┐
 *   one-shot sfx ───┴─→  sfxBus  ─┴─→ master ─→ destination
 *                            └─→ reverbSend ─→ convolver ─┘
 *
 * Browsers refuse to start an AudioContext before a user gesture, so nothing is
 * constructed until `unlock()` is called from a real click or keypress.
 */

export type RegionId =
  | "abyss" | "siren-sea" | "throne-room" | "hive"
  | "mirror-dark" | "spawning-grounds" | "colosseum" | "catacombs";

/** The passages between territories, and wherever the player starts. */
export type AmbienceId = RegionId | "corridor";

export type SfxName =
  | "step" | "discover" | "encounter" | "select" | "hover" | "open" | "close"
  | "attack" | "hit" | "correct" | "wrong" | "victory" | "defeat"
  | "mastery" | "levelUp" | "capstone";

const STORE_KEY = "nf-audio-v1";

interface AudioPrefs { music: number; sfx: number; muted: boolean }
const DEFAULT_PREFS: AudioPrefs = { music: 0.45, sfx: 0.7, muted: false };

/** Each territory gets a voice. The character is the point — you should be able
 *  to tell where you are with your eyes shut. */
interface RegionVoice {
  /** Root pitches, in Hz. Stacked as sustained oscillators. */
  chord: number[];
  type: OscillatorType;
  /** Low-pass cutoff for the drone. */
  cutoff: number;
  /** Amplitude-modulation rate (Hz) and depth (0-1) — the "pulse" of a place. */
  lfoRate: number;
  lfoDepth: number;
  /** Filtered-noise layer level: wind, static, breath. */
  noise: number;
  /** Noise band centre. */
  noiseFreq: number;
  /** Detune spread in cents — wider is more unsettled. */
  detune: number;
  gain: number;
}

const VOICES: Record<AmbienceId, RegionVoice> = {
  // Neutral stone: barely there, so crossing into a territory is a real change.
  corridor: { chord: [65.4, 98, 130.8], type: "sine", cutoff: 380, lfoRate: 0.06, lfoDepth: 0.25, noise: 0.045, noiseFreq: 220, detune: 5, gain: 0.5 },
  // Endless descent: a low sine that never resolves.
  abyss: { chord: [55, 82.5, 110], type: "sine", cutoff: 420, lfoRate: 0.07, lfoDepth: 0.3, noise: 0.03, noiseFreq: 180, detune: 6, gain: 0.9 },
  // Alluring, over-sweet: high partials with a slow tremolo.
  "siren-sea": { chord: [220, 277.2, 329.6, 440], type: "sine", cutoff: 1800, lfoRate: 0.9, lfoDepth: 0.45, noise: 0.05, noiseFreq: 900, detune: 9, gain: 0.55 },
  // Institutional grandeur: stacked fifths, organ-like, immovable.
  "throne-room": { chord: [98, 146.8, 196, 293.7], type: "triangle", cutoff: 900, lfoRate: 0.05, lfoDepth: 0.12, noise: 0.02, noiseFreq: 300, detune: 3, gain: 0.6 },
  // Many small things: a saw cluster with fast amplitude flutter.
  hive: { chord: [147, 155, 165], type: "sawtooth", cutoff: 700, lfoRate: 7.5, lfoDepth: 0.3, noise: 0.07, noiseFreq: 1600, detune: 22, gain: 0.4 },
  // Doubling, slightly wrong: two voices beating against each other.
  "mirror-dark": { chord: [130.8, 131.9, 196, 197.6], type: "sine", cutoff: 1100, lfoRate: 0.22, lfoDepth: 0.35, noise: 0.04, noiseFreq: 700, detune: 14, gain: 0.55 },
  // Proliferation: irregular, granular, always multiplying.
  "spawning-grounds": { chord: [110, 164.8, 220], type: "triangle", cutoff: 800, lfoRate: 3.1, lfoDepth: 0.4, noise: 0.09, noiseFreq: 2200, detune: 17, gain: 0.45 },
  // Weight and iron: low brass-ish with a slow heave.
  colosseum: { chord: [73.4, 110, 146.8], type: "sawtooth", cutoff: 520, lfoRate: 0.35, lfoDepth: 0.28, noise: 0.05, noiseFreq: 420, detune: 11, gain: 0.5 },
  // What sleeps below: sparse, cold, enormous reverberant space.
  catacombs: { chord: [41.2, 61.7, 92.5], type: "sine", cutoff: 340, lfoRate: 0.04, lfoDepth: 0.5, noise: 0.06, noiseFreq: 140, detune: 8, gain: 0.85 },
};

/** One sustained region bed. Built on demand, faded in and out. */
class Bed {
  private nodes: AudioScheduledSourceNode[] = [];
  readonly out: GainNode;

  constructor(ctx: AudioContext, v: RegionVoice, dest: AudioNode, reverb: AudioNode) {
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(dest);

    const send = ctx.createGain();
    send.gain.value = 0.5;
    this.out.connect(send);
    send.connect(reverb);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = v.cutoff;
    filter.Q.value = 0.7;
    filter.connect(this.out);

    // Amplitude LFO — the breath of the place.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = v.lfoRate;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = v.lfoDepth;
    lfo.connect(lfoGain);

    v.chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = v.type;
      osc.frequency.value = freq;
      // Alternating detune keeps the stack from phasing into a single tone.
      osc.detune.value = (i % 2 ? 1 : -1) * v.detune;
      const g = ctx.createGain();
      g.gain.value = (v.gain / v.chord.length) * (1 - v.lfoDepth * 0.5);
      lfoGain.connect(g.gain);
      osc.connect(g);
      g.connect(filter);
      osc.start();
      this.nodes.push(osc);
    });

    if (v.noise > 0) {
      const noise = ctx.createBufferSource();
      noise.buffer = makeNoise(ctx, 4);
      noise.loop = true;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = v.noiseFreq;
      band.Q.value = 0.8;
      const ng = ctx.createGain();
      ng.gain.value = v.noise;
      noise.connect(band); band.connect(ng); ng.connect(filter);
      noise.start();
      this.nodes.push(noise);
    }

    lfo.start();
    this.nodes.push(lfo);
  }

  fade(ctx: AudioContext, to: number, seconds: number) {
    const g = this.out.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(g.value, ctx.currentTime);
    g.linearRampToValueAtTime(to, ctx.currentTime + seconds);
  }

  stop(ctx: AudioContext, after: number) {
    this.nodes.forEach((n) => { try { n.stop(ctx.currentTime + after); } catch { /* already stopped */ } });
  }
}

function makeNoise(ctx: AudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** A cavern, approximated: exponentially decaying noise as an impulse response. */
function makeImpulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

class GameAudio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private reverb!: ConvolverNode;
  private beds = new Map<AmbienceId, Bed>();
  private current: AmbienceId | null = null;
  private lastStep = 0;
  prefs: AudioPrefs = { ...DEFAULT_PREFS };
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) this.prefs = { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    } catch { /* defaults are fine */ }
  }

  get ready() { return this.ctx !== null; }

  subscribe(fn: () => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  private emit() { this.listeners.forEach((f) => f()); }

  /** Must be called from a user gesture. Safe to call repeatedly. */
  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      this.ctx = ctx;

      this.master = ctx.createGain();
      this.master.gain.value = this.prefs.muted ? 0 : 1;
      this.master.connect(ctx.destination);

      this.reverb = ctx.createConvolver();
      this.reverb.buffer = makeImpulse(ctx, 3.2, 2.6);
      const wet = ctx.createGain();
      wet.gain.value = 0.32;
      this.reverb.connect(wet);
      wet.connect(this.master);

      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = this.prefs.music;
      this.musicBus.connect(this.master);

      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = this.prefs.sfx;
      this.sfxBus.connect(this.master);

      this.emit();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    // A region may have been requested before the first gesture.
    if (this.current) { const r = this.current; this.current = null; this.setRegion(r); }
  }

  setMuted(muted: boolean) {
    this.prefs.muted = muted;
    this.persist();
    if (this.ctx) this.master.gain.linearRampToValueAtTime(muted ? 0 : 1, this.ctx.currentTime + 0.15);
    this.emit();
  }
  setMusic(v: number) {
    this.prefs.music = v; this.persist();
    if (this.ctx) this.musicBus.gain.linearRampToValueAtTime(v, this.ctx.currentTime + 0.1);
    this.emit();
  }
  setSfx(v: number) {
    this.prefs.sfx = v; this.persist();
    if (this.ctx) this.sfxBus.gain.linearRampToValueAtTime(v, this.ctx.currentTime + 0.1);
    this.emit();
  }
  private persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.prefs)); } catch { /* private mode */ }
  }

  /** Crossfade to a territory's bed. Beds are built once and kept. */
  setRegion(region: AmbienceId | null) {
    if (region === this.current) return;
    const prev = this.current;
    this.current = region;
    if (!this.ctx) return; // will be applied on unlock()

    if (prev) this.beds.get(prev)?.fade(this.ctx, 0, 2.2);
    if (!region) return;

    let bed = this.beds.get(region);
    if (!bed) {
      bed = new Bed(this.ctx, VOICES[region], this.musicBus, this.reverb);
      this.beds.set(region, bed);
    }
    bed.fade(this.ctx, 1, 2.8);
  }

  /** Footsteps are rate-limited here rather than at the call site. */
  step() {
    const now = performance.now();
    if (now - this.lastStep < 260) return;
    this.lastStep = now;
    this.sfx("step");
  }

  sfx(name: SfxName) {
    const ctx = this.ctx;
    if (!ctx || this.prefs.muted) return;
    const t = ctx.currentTime;

    switch (name) {
      case "step": return this.noiseBurst(t, 0.07, 260, 0.055, 1.4);
      case "hover": return this.blip(t, 1180, 0.035, "sine", 0.035);
      case "select": return this.blip(t, 720, 0.06, "triangle", 0.09);
      case "open": return this.sweep(t, 300, 780, 0.16, 0.07);
      case "close": return this.sweep(t, 700, 260, 0.14, 0.055);

      // Discovery: a rising figure with a shimmer of reverb — the good surprise.
      case "discover":
        [523.3, 659.3, 784, 1046.5].forEach((f, i) => this.blip(t + i * 0.075, f, 0.4, "sine", 0.12, true));
        return;

      // Something is near. Two low notes, a minor second apart. Unwelcome.
      case "encounter":
        this.blip(t, 116.5, 0.5, "sawtooth", 0.1, true);
        this.blip(t + 0.09, 110, 0.6, "sawtooth", 0.1, true);
        return;

      case "attack": return this.sweep(t, 900, 180, 0.18, 0.13);
      case "hit":
        this.noiseBurst(t, 0.14, 900, 0.2, 3);
        this.sweep(t, 260, 70, 0.2, 0.16);
        return;

      // Right answer: a bright major triad, ringing.
      case "correct":
        [659.3, 830.6, 987.8].forEach((f, i) => this.blip(t + i * 0.045, f, 0.55, "triangle", 0.11, true));
        return;

      // Wrong answer: a tritone, unresolved.
      case "wrong":
        this.blip(t, 233.1, 0.5, "sawtooth", 0.12, true);
        this.blip(t + 0.02, 329.6, 0.5, "sawtooth", 0.1, true);
        return;

      case "victory":
        [523.3, 659.3, 784, 1046.5, 1318.5].forEach((f, i) => this.blip(t + i * 0.1, f, 0.8, "triangle", 0.13, true));
        return;

      case "defeat":
        [349.2, 311.1, 277.2, 233.1].forEach((f, i) => this.blip(t + i * 0.13, f, 0.7, "sine", 0.11, true));
        return;

      case "levelUp":
        [392, 523.3, 659.3, 784].forEach((f, i) => this.blip(t + i * 0.08, f, 0.7, "sine", 0.12, true));
        return;

      // A territory falls. Fifths stacked upward, then a low anchor.
      case "mastery":
        [261.6, 392, 523.3, 784].forEach((f, i) => this.blip(t + i * 0.11, f, 1.1, "triangle", 0.13, true));
        this.blip(t + 0.5, 130.8, 1.6, "sine", 0.14, true);
        return;

      case "capstone":
        [261.6, 329.6, 392, 523.3, 659.3, 784, 1046.5].forEach((f, i) =>
          this.blip(t + i * 0.13, f, 1.8, "triangle", 0.12, true));
        this.blip(t + 0.9, 65.4, 3, "sine", 0.16, true);
        return;
    }
  }

  // ── primitives ──

  private blip(at: number, freq: number, dur: number, type: OscillatorType, peak: number, verb = false) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g);
    g.connect(this.sfxBus);
    if (verb) { const s = ctx.createGain(); s.gain.value = 0.55; g.connect(s); s.connect(this.reverb); }
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  private sweep(at: number, from: number, to: number, dur: number, peak: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), at + dur);
    g.gain.setValueAtTime(peak, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g); g.connect(this.sfxBus);
    osc.start(at); osc.stop(at + dur + 0.05);
  }

  private noiseBurst(at: number, dur: number, freq: number, peak: number, q: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = makeNoise(ctx, 0.4);
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    // Vary the pitch a little so repeated footfalls never sound identical.
    band.frequency.value = freq * (0.85 + Math.random() * 0.3);
    band.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(band); band.connect(g); g.connect(this.sfxBus);
    src.start(at); src.stop(at + dur + 0.05);
  }
}

export const audio = new GameAudio();
