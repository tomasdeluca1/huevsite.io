# Audio credits

Every sound in the promo is synthesized in `scripts/synthesize-audio.mjs`. There are no stock recordings, no downloaded samples, and no music bed.

| Sound | What it is | Where it sits | License |
|---|---|---|---|
| `clack` | Mechanical key. A 1–3 ms noise click, a short resonance between about 1.9 and 4 kHz, and a tiny bottom-out thump. Pitch and length vary per hit. | Cuts in the builders montage and most type hits | Original synthesis. [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `enter` | A heavier key: the same clack plus a longer, lower body, like committing a line. | End of a phrase, Builder de la Semana | Original synthesis. CC0 |
| `commit` | Two dry clacks about one frame apart. | Project cards and some passes of the 3D wall | Original synthesis. CC0 |
| `tick` | A square tick under 10 ms. A cursor, not a beep. | Opening cursor, country counts | Original synthesis. CC0 |
| `impact` | A 40 ms hit whose pitch falls from ~240 Hz to ~70 Hz, with a little noise. It is a strike, not a riser. | Logo lock, hero names, section words, the CTA | Original synthesis. CC0 |
| `grain` | One grain of three inharmonic sines (roughly 170 / 430 / 980 Hz, shifted each time) under 80 ms, at low level. Placed on an irregular count so it never becomes a beat. | Under the montage only | Original synthesis. CC0 |
| `egg` | Six short highpassed cracks over ~110 ms, then a low crunch. An eggshell, not a whoosh. | The 🥚 on the CTA, on the cut into the hold | Original synthesis. CC0 |
| silence | Frames with no event. | Before “Que te encuentren.” and before the CTA | — |

The master is `public/audio/master.wav`: mono, 48 kHz, 45.000 s. Hits are soft-clipped and peak-normalized. Measured on the final file: integrated loudness −23.1 LUFS, sample peak −2.5 dBFS, true peak −1.2 dBFS. Nothing clips. Integrated loudness is not −14 because the cut is short transients plus silence on purpose; another 9 dB of gain would push the true peak through 0 dBFS. The hits already sit at the ceiling.

Not in this cut, on purpose: whooshes, risers, stock drums, and any track from a sample library.
