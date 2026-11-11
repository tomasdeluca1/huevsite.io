/**
 * Anuncio del MCP. 30 s a 30 fps.
 * La música va cerca de 100 BPM, o sea 18 frames por pulso: los cortes caen en múltiplos de BEAT.
 * Este archivo lo importan la película y scripts/synthesize-audio.mjs (Node lo lee directo,
 * así que acá sólo va sintaxis borrable: nada de enums ni namespaces).
 */

export const FPS = 30;
export const BEAT = 18;
export const DURATION = 50 * BEAT;

export const AT = {
  hook: 0,
  prompt: 6 * BEAT,
  demo: 13 * BEAT,
  tools: 30 * BEAT,
  clients: 37 * BEAT,
  cta: 43 * BEAT,
};

export const PROMPT = "Sumá el MCP a mis proyectos y publicá el avance de hoy.";
export const ENDPOINT = "https://huevsite.io/api/mcp";

export const TYPE = {
  promptFrom: AT.prompt + 16,
  promptTo: AT.prompt + 82,
  enter: 11 * BEAT,
  endpointFrom: AT.clients + 62,
  endpointTo: AT.clients + 92,
};

/** Pasos de la demo: cada uno arranca en un pulso. */
export const DEMO = {
  read: AT.demo + 6,
  dry: 17 * BEAT,
  yes: 21 * BEAT,
  write: 22 * BEAT,
  post: 25 * BEAT,
};

export const TOOLS = {
  list: AT.tools + 14,
  prompts: 34 * BEAT,
};

export const CLIENT_AT = [0, 1, 2, 3].map((i) => 38 * BEAT + i * 9);

type Cue = { frame: number; type: string; gain?: number; variant?: number };

const cues: Cue[] = [];
const cue = (frame: number, type: string, gain = 1, variant = 0) => cues.push({ frame, type, gain, variant });

// Gancho: una tecla por línea.
cue(0, "tick", 0.8);
[8, 17, 26, 35].forEach((f, i) => cue(f, "clack", 0.7, i));

// Prompt: tecleo y Enter.
for (let f = TYPE.promptFrom; f < TYPE.promptTo; f += 4) cue(f, "tick", 0.45, f);
cue(TYPE.enter, "enter", 0.9);

// Demo.
cue(DEMO.read, "clack", 0.6, 1);
cue(DEMO.read + 18, "tick", 0.7, 1);
cue(DEMO.dry, "clack", 0.7, 2);
cue(DEMO.dry + 12, "grain", 0.9, 2);
for (let f = DEMO.yes; f < DEMO.yes + 10; f += 3) cue(f, "tick", 0.5, f);
cue(DEMO.yes + 12, "enter", 0.7, 1);
cue(DEMO.write, "commit", 1);
cue(DEMO.post, "commit", 0.9);

// 9 tools.
cue(AT.tools, "impact", 0.9);
for (let i = 0; i < 9; i++) cue(TOOLS.list + i * 3, "tick", 0.5, i);
cue(TOOLS.prompts, "clack", 0.8, 3);

// Clientes.
cue(AT.clients, "impact", 0.7);
CLIENT_AT.forEach((f, i) => cue(f, "clack", 0.8, i + 1));
for (let f = TYPE.endpointFrom; f < TYPE.endpointTo; f += 4) cue(f, "tick", 0.4, f);

// Cierre.
cue(AT.cta, "impact", 1);
cue(AT.cta + 30, "enter", 0.8, 2);

export const SOUNDS = cues;
