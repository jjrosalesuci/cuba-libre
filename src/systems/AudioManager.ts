import { load, save } from './SaveManager';

/**
 * Audio placeholder sintetizado con WebAudio: efectos 8-bit y loops de
 * chiptune con aire de son (clave 3-2, tumbao en el bajo). Se reemplaza por
 * archivos .ogg cuando exista la música final.
 */

type Wave = OscillatorType;
export type Sfx =
  | 'jump' | 'swing' | 'hit' | 'hurt' | 'pickup' | 'coin' | 'whistle'
  | 'bossHit' | 'paper' | 'clear' | 'select' | 'pot' | 'puff' | 'checkpoint' | 'die';
export type Track = 'title' | 'level' | 'boss' | 'clear';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let current: Track | null = null;
let timer: number | null = null;
let nextTime = 0;
let step = 0;

function ac(): AudioContext | null {
  if (!ctx) {
    try {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = load().volume;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.35;
      musicGain.connect(master);
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setVolume(v: number): void {
  const vol = Math.max(0, Math.min(1, v));
  save({ volume: vol });
  if (master) master.gain.value = vol;
}

export function getVolume(): number {
  return load().volume;
}

function tone(freq: number, dur: number, wave: Wave, vol: number, t0: number, slideTo?: number, dest?: AudioNode): void {
  const c = ctx!;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = wave;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(dest ?? master!);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

let noiseBuf: AudioBuffer | null = null;
function noise(dur: number, vol: number, t0: number, hp = 1000, dest?: AudioNode): void {
  const c = ctx!;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f).connect(g).connect(dest ?? master!);
  s.start(t0);
  s.stop(t0 + dur + 0.02);
}

export function sfx(name: Sfx): void {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  switch (name) {
    case 'jump': tone(220, 0.15, 'square', 0.12, t, 520); break;
    case 'swing': noise(0.08, 0.15, t, 2500); break;
    case 'hit': tone(160, 0.1, 'square', 0.2, t, 60); noise(0.08, 0.2, t, 800); break;
    case 'hurt': tone(400, 0.25, 'sawtooth', 0.15, t, 90); break;
    case 'pickup': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.08, 'square', 0.1, t + i * 0.06)); break;
    case 'coin': tone(988, 0.06, 'square', 0.1, t); tone(1319, 0.2, 'square', 0.1, t + 0.06); break;
    case 'whistle': tone(2200, 0.35, 'sine', 0.12, t, 2600); tone(2400, 0.2, 'sine', 0.08, t + 0.4); break;
    case 'bossHit': tone(120, 0.2, 'square', 0.25, t, 50); noise(0.15, 0.25, t, 400); break;
    case 'paper': noise(0.12, 0.1, t, 4000); break;
    case 'pot': tone(1400, 0.12, 'triangle', 0.08, t, 1300); noise(0.05, 0.08, t, 5000); break;
    case 'puff': noise(0.25, 0.15, t, 300); break;
    case 'checkpoint': [392, 523, 659].forEach((f, i) => tone(f, 0.12, 'triangle', 0.15, t + i * 0.1)); break;
    case 'select': tone(660, 0.06, 'square', 0.1, t); break;
    case 'die': [523, 440, 349, 262, 196].forEach((f, i) => tone(f, 0.14, 'square', 0.13, t + i * 0.12)); break;
    case 'clear': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', 0.12, t + i * 0.13)); break;
  }
}

// ---------------------------------------------------------------- música

const N = (n: string): number => {
  // 'C4', 'F#3', 'Bb2'
  const m = /^([A-G])(#|b)?(\d)$/.exec(n)!;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1] as 'C'];
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  const midi = (Number(m[3]) + 1) * 12 + base + acc;
  return 440 * Math.pow(2, (midi - 69) / 12);
};

interface Song {
  bpm: number;
  /** 16 pasos por compás; '.' = silencio. Cada string separado por espacios es un paso. */
  lead: string[];
  bass: string[];
  clave: boolean;
  leadWave: Wave;
}

const seq = (s: string): string[] => s.trim().split(/\s+/);

const SONGS: Record<Track, Song> = {
  title: {
    bpm: 96, clave: true, leadWave: 'triangle',
    lead: seq(`E5 . . D5 C5 . A4 . . . C5 . D5 . E5 .  G5 . . E5 D5 . C5 . . . D5 . C5 . A4 .
               F5 . . E5 D5 . C5 . . . A4 . C5 . D5 .  E5 . . . . . . . . . . . . . . .`),
    bass: seq(`. . . A2 . . A2 . . . . E2 . . E2 .  . . . A2 . . A2 . . . . E2 . . E2 .
               . . . D2 . . D2 . . . . A2 . . A2 .  . . . E2 . . E2 . . . . E2 . . G#2 .`),
  },
  level: {
    bpm: 120, clave: true, leadWave: 'square',
    lead: seq(`C5 . E5 . G5 . E5 G5 . A5 . G5 E5 . C5 .  D5 . F5 . A5 . F5 A5 . B5 . A5 F5 . D5 .
               E5 . G5 . C6 . G5 E5 . F5 . E5 D5 . C5 .  D5 . . G4 B4 . D5 . F5 . E5 . D5 . . .`),
    bass: seq(`. . . C3 . . C3 . . . . G2 . . G2 .  . . . D3 . . D3 . . . . A2 . . A2 .
               . . . C3 . . C3 . . . . F2 . . F2 .  . . . G2 . . G2 . . . . G2 . . B2 .`),
  },
  boss: {
    bpm: 140, clave: true, leadWave: 'sawtooth',
    lead: seq(`A4 . A4 C5 . A4 E5 . D5 . C5 . B4 . G#4 .  A4 . A4 C5 . A4 F5 . E5 . D5 . C5 . B4 .`),
    bass: seq(`A2 . . A2 . . A3 . A2 . . E2 . . E3 .  F2 . . F2 . . F3 . E2 . . E2 . . G#2 .`),
  },
  clear: {
    bpm: 110, clave: false, leadWave: 'square',
    lead: seq(`C5 . E5 . G5 . C6 . . . G5 . C6 . . .  . . . . . . . . . . . . . . . .`),
    bass: seq(`C3 . . . E3 . . . G3 . . . C3 . . .  . . . . . . . . . . . . . . . .`),
  },
};

// clave 3-2 sobre 2 compases de 16 pasos
const CLAVE = new Set([0, 6, 12, 20, 24]);

function schedule(): void {
  if (!ctx || !current) return;
  const song = SONGS[current];
  const stepDur = 60 / song.bpm / 4;
  while (nextTime < ctx.currentTime + 0.15) {
    const len = song.lead.length;
    const i = step % len;
    const l = song.lead[i];
    const b = song.bass[i % song.bass.length];
    if (l !== '.') tone(N(l), stepDur * 1.8, song.leadWave, 0.18, nextTime, undefined, musicGain!);
    if (b !== '.') tone(N(b), stepDur * 2.2, 'triangle', 0.35, nextTime, undefined, musicGain!);
    if (song.clave && CLAVE.has(i % 32)) tone(2000, 0.04, 'square', 0.06, nextTime, undefined, musicGain!);
    if (song.clave && i % 4 === 2) noise(0.03, 0.05, nextTime, 6000, musicGain!);
    nextTime += stepDur;
    step++;
    if (current === 'clear' && step >= len) { stopMusic(); return; }
  }
}

export function playMusic(track: Track): void {
  const c = ac();
  if (!c) return;
  if (current === track) return;
  stopMusic();
  current = track;
  step = 0;
  nextTime = c.currentTime + 0.05;
  timer = window.setInterval(schedule, 50);
  schedule();
}

export function stopMusic(): void {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  current = null;
}
