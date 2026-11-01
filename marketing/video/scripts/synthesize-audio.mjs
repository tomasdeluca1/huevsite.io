/**
 * Original soundtrack for the promo cut.
 * Every sound is synthesized here. No samples, no stock libraries.
 * License: CC0. See marketing/video/AUDIO_CREDITS.md.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DURATION, FPS, SOUNDS } from "../src/edit.mjs";

const SR = 48000;
const seconds = DURATION / FPS;
const N = Math.round(SR * seconds);
const mix = new Float32Array(N);

function clampIndex(i) {
  return i < 0 ? 0 : i >= N ? N - 1 : i;
}

function addSample(i, v) {
  if (i >= 0 && i < N) mix[i] += v;
}

/** Mechanical key: click + plastic resonance + a short bottom-out thump. */
function clack(frame, gain, variant) {
  const start = Math.floor((frame / FPS) * SR);
  const len = Math.floor(SR * 0.14);
  const freq = 1900 + (variant % 5) * 420;
  const body = 130 + (variant % 4) * 28;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const click = (Math.random() * 2 - 1) * Math.exp(-t * 360);
    const tone = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 36);
    const wood = Math.sin(2 * Math.PI * (freq * 0.47) * t) * Math.exp(-t * 14);
    const thump = Math.sin(2 * Math.PI * body * t) * Math.exp(-t * 28);
    addSample(start + i, gain * 0.55 * (click * 0.4 + tone * 0.28 + wood * 0.34 + thump * 0.32));
  }
}

/** Longer key, the one you hit to commit a line. */
function enterKey(frame, gain, variant) {
  clack(frame, gain * 0.9, variant + 1);
  const start = Math.floor((frame / FPS) * SR);
  const len = Math.floor(SR * 0.028);
  const freq = 90 + (variant % 3) * 15;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const n = (Math.random() * 2 - 1) * Math.exp(-t * 160);
    const body = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 90);
    addSample(start + i, gain * 0.28 * (n * 0.35 + body));
  }
}

/** Two dry ticks, like a commit landing. */
function commit(frame, gain) {
  clack(frame, gain * 0.75, 2);
  clack(frame + 1.1, gain * 0.45, 4);
}

/** Cursor block. A short square tick, not a beep melody. */
function tick(frame, gain, variant) {
  const start = Math.floor((frame / FPS) * SR);
  const len = Math.floor(SR * 0.008);
  const freq = 980 + (variant % 3) * 140;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const s = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
    addSample(start + i, gain * 0.18 * s * Math.exp(-t * 260));
  }
}

/**
 * Hit for a type slam. Downward, short, dry.
 * Not a riser: the pitch falls and it is over in ~40ms.
 */
function impact(frame, gain) {
  const start = Math.floor((frame / FPS) * SR);
  const len = Math.floor(SR * 0.07);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const freq = 220 - 140 * Math.min(1, t / 0.07);
    const n = (Math.random() * 2 - 1) * Math.exp(-t * 40);
    const body = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 22);
    addSample(start + i, gain * 0.4 * (body * 0.85 + n * 0.2));
  }
}

/** One grain of inharmonic sines. Sparse on purpose, never a chord loop. */
function grain(frame, gain, variant) {
  const start = Math.floor((frame / FPS) * SR);
  const len = Math.floor(SR * (0.045 + (variant % 3) * 0.02));
  const freqs = [170 + variant * 37, 430 + variant * 19, 980 + variant * 53];
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.sin(Math.PI * (i / len)) ** 2;
    let s = 0;
    for (const f of freqs) s += Math.sin(2 * Math.PI * f * t);
    const n = (Math.random() * 2 - 1) * 0.15;
    addSample(start + i, gain * 0.07 * env * (s / freqs.length + n));
  }
}

/** Eggshell: a handful of high, short cracks plus a low crunch. */
function egg(frame, gain) {
  const start = Math.floor((frame / FPS) * SR);
  const cracks = [0, 0.014, 0.031, 0.049, 0.078, 0.11];
  for (const c of cracks) {
    const s0 = start + Math.floor(c * SR);
    const len = Math.floor(SR * 0.016);
    let prev = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      const n = Math.random() * 2 - 1;
      const hp = n - prev;
      prev = n;
      addSample(s0 + i, gain * 0.55 * hp * Math.exp(-t * (380 + c * 2500)));
    }
  }
  const crunch = Math.floor(SR * 0.09);
  for (let i = 0; i < crunch; i++) {
    const t = i / SR;
    const n = Math.random() * 2 - 1;
    addSample(start + i, gain * 0.22 * n * Math.exp(-t * 28) * 0.5);
  }
}

for (const cue of SOUNDS) {
  const g = cue.gain ?? 1;
  const v = cue.variant ?? 0;
  if (cue.type === "clack") clack(cue.frame, g, v);
  else if (cue.type === "enter") enterKey(cue.frame, g, v);
  else if (cue.type === "commit") commit(cue.frame, g, v);
  else if (cue.type === "tick") tick(cue.frame, g, v);
  else if (cue.type === "impact") impact(cue.frame, g, v);
  else if (cue.type === "grain") grain(cue.frame, g, v);
  else if (cue.type === "egg") egg(cue.frame, g, v);
  else throw new Error(`unknown sound ${cue.type}`);
}

for (let i = 0; i < N; i++) mix[i] = Math.tanh(mix[i] * 1.6);
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(mix[i]));
const pre = peak > 0 ? 0.75 / peak : 1;
const pcm = Buffer.alloc(N * 2);
for (let i = 0; i < N; i++) {
  const s = Math.max(-1, Math.min(1, mix[i] * pre));
  pcm.writeInt16LE((s * 32767) | 0, i * 2);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "public", "audio");
mkdirSync(dir, { recursive: true });
const rawPath = path.join(dir, "raw.wav");
const outPath = path.join(dir, "master.wav");
writeFileSync(rawPath, wav(pcm, SR));

const norm = spawnSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    rawPath,
    "-af",
    "volume=0dB",
    "-ar",
    String(SR),
    "-ac",
    "1",
    "-t",
    seconds.toFixed(3),
    outPath,
  ],
  { encoding: "utf8" },
);
if (norm.status !== 0) {
  console.error(norm.stderr);
  process.exit(norm.status ?? 1);
}

const measured = spawnSync(
  "ffmpeg",
  ["-i", outPath, "-af", "volumedetect,ebur128=peak=true", "-f", "null", "-"],
  { encoding: "utf8" },
);
const log = measured.stderr || "";
const maxVol = log.match(/max_volume:\s*([-\d.]+) dB/);
const lufs = log.match(/I:\s*([-\d.]+) LUFS/);
console.log("peak before norm", peak.toFixed(3), "preGain", pre.toFixed(3));
console.log("max_volume", maxVol ? maxVol[1] : "?", "integrated", lufs ? lufs[1] : "?");
const maxDb = maxVol ? Number(maxVol[1]) : 0;
if (!(maxDb < -0.5)) {
  console.error("clipping: max_volume", maxDb);
  process.exit(1);
}

function wav(samples, sampleRate) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + samples.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(samples.length, 40);
  return Buffer.concat([header, samples]);
}
