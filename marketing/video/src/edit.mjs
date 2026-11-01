/** Shot list for the 45s cut. Audio cues are the shot starts, so cuts land on sound. */

export const FPS = 30;
export const DURATION = 45 * FPS;

const shots = [];
let cursor = 0;

function add(shot) {
  const next = { ...shot, from: cursor };
  cursor += next.dur;
  shots.push(next);
  return next;
}

add({ kind: "cursor", dur: 8, sound: "tick" });
add({ kind: "logo", dur: 12, sound: "impact" });
add({ kind: "logo", dur: 14, sound: "clack", phase: 1 });
add({ kind: "type", dur: 14, sound: "clack", text: "Mostrá", accent: false });
add({ kind: "type", dur: 16, sound: "enter", text: "lo que shippeás.", accent: true });
add({ kind: "gap", dur: 10, sound: null });
add({ kind: "type", dur: 16, sound: "impact", text: "Que te encuentren.", accent: false });

const clusterDur = [12, 14, 16, 18, 12, 15, 13];
for (let i = 0; i < 13; i++) {
  add({
    kind: "cluster",
    dur: clusterDur[i % clusterDur.length],
    sound: i % 3 === 0 ? "enter" : "clack",
    index: i * 4,
    ramp: i % 2 === 0 ? "in" : "out",
  });
  if (i % 4 === 3) {
    add({
      kind: "hero",
      dur: 12,
      sound: "impact",
      index: i * 4,
    });
  }
}

for (let i = 0; i < 10; i++) {
  add({
    kind: "fly",
    dur: i % 2 === 0 ? 18 : 12,
    sound: i % 3 === 0 ? "commit" : "clack",
    row: i % 13,
    fast: i % 2 === 1,
    ramp: i % 2 === 0 ? "out" : "in",
  });
}

for (let i = 0; i < 13; i++) {
  add({
    kind: "cluster",
    dur: [14, 12, 16, 13, 15][i % 5],
    sound: i % 2 === 0 ? "clack" : "tick",
    index: i * 4,
    ramp: i % 2 === 0 ? "out" : "in",
  });
}

for (let i = 0; i < 15; i++) {
  add({
    kind: "fly",
    dur: [12, 16, 14, 18][i % 4],
    sound: i % 4 === 0 ? "commit" : "clack",
    row: (i * 3) % 13,
    fast: i % 3 !== 0,
    ramp: i % 2 === 0 ? "in" : "out",
  });
}

const phrases = [
  ["No digas que sos builder.", false],
  ["Probalo.", true],
];
for (const [text, accent] of phrases) {
  add({ kind: "type", dur: 14, sound: accent ? "impact" : "clack", text, accent });
}
for (let i = 0; i < 8; i++) {
  add({
    kind: "project",
    dur: i % 2 === 0 ? 16 : 14,
    sound: i % 2 === 0 ? "commit" : "clack",
    index: i,
  });
}

add({ kind: "type", dur: 14, sound: "impact", text: "Argentina y LATAM.", accent: false });
for (let i = 0; i < 6; i++) {
  add({ kind: "geo", dur: 12, sound: "tick", index: i });
}

for (const text of ["Se rankean.", "Se descubren.", "Se nominan."]) {
  add({ kind: "type", dur: 14, sound: "clack", text, accent: text.startsWith("Se n") });
}
add({ kind: "bdls", dur: 18, sound: "enter" });
for (let i = 0; i < 3; i++) {
  add({ kind: "launch", dur: 14, sound: "commit", index: i });
}

add({ kind: "type", dur: 16, sound: "impact", text: "Nominados", accent: false });
add({ kind: "type", dur: 18, sound: "clack", text: "PremiosTech.la · Comunidad", accent: true });
add({ kind: "gap", dur: 8, sound: null });

const ctaDur = DURATION - cursor;
if (ctaDur < 90 || ctaDur > 140) {
  throw new Error(`CTA dur ${ctaDur} is outside 3–4.5s. Timeline cursor=${cursor}`);
}
add({ kind: "cta", dur: ctaDur, sound: "egg" });

if (cursor !== DURATION) {
  throw new Error(`Timeline is ${cursor} frames, expected ${DURATION}`);
}

const steps = [29, 47, 23, 61, 37, 43, 31];
const sounds = [];
for (const shot of shots) {
  if (!shot.sound) continue;
  sounds.push({ frame: shot.from, type: shot.sound, gain: 1, variant: shot.from % 5 });
  if ((shot.sound === "clack" || shot.sound === "enter") && shot.dur >= 14) {
    sounds.push({ frame: shot.from + 5, type: "clack", gain: 0.62, variant: (shot.from + 2) % 5 });
  }
}
let grainAt = 110;
let step = 0;
while (grainAt < DURATION - 120) {
  sounds.push({ frame: grainAt, type: "grain", gain: 0.2, variant: step % 5 });
  grainAt += steps[step % steps.length];
  step += 1;
}

export const SHOTS = shots;
export const SOUNDS = sounds;

export function shotAt(frame) {
  for (const shot of shots) {
    if (frame >= shot.from && frame < shot.from + shot.dur) return shot;
  }
  return shots[shots.length - 1];
}
