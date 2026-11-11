# Audio credits

The bed is one CC0 track. Under it are three soft tones written for this cut: a low chord when the logo appears, a quiet fifth when the builders appear, and a low octave on the end card. They are sine tones with a slow attack and a slow release. No whoosh, no click, no noise burst.

| Title | Artist | Source | License |
|---|---|---|---|
| Fresh Focus | Kevin MacLeod | https://freepd.com/music/Fresh%20Focus.mp3 | [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) |
| Guide chord, proof fifth, end-card octave | Original tones for this video | Synthesized in the edit, not from a sample library | [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) |

The FreePD catalog page states that all of its music is “licensed CC0 1.0 Universal Public Domain Dedication.” Archived source: https://web.archive.org/web/20231115051638/https://freepd.com/

The file used here is the archived master https://web.archive.org/web/20250106221710/https://freepd.com/music/Fresh%20Focus.mp3. The release note that travels with the track reads: “Written by Kevin MacLeod. Bright and airy. This music is available for commercial and non-commercial purposes. Public Domain.”

The edit uses the opening of that track, slowed about 3% so the pulse sits near 100 BPM, with a gentle low-pass at 6.5 kHz, a short fade in, and a fade out. The three tones sit well under the music. The mix is `public/audio/bed.wav`: stereo, 48 kHz, 36.000 s, about −14 LUFS, true peak under −1 dBTP.

## MCP announcement cut

`McpVertical` and `McpLandscape` reuse `public/audio/bed.wav` and fade it out at 30 s. On top goes `public/audio/mcp-sfx.wav`: key and commit sounds synthesized by `scripts/synthesize-audio.mjs` from the cues in `src/mcp/timeline.ts` (`npm run audio:mcp`). No samples, CC0.
