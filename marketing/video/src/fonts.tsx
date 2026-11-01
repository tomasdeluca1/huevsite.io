import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

const LATIN =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
const LATIN_EXT =
  "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF";

const FACES: { family: string; file: string; weight: string; range: string }[] = [
  { family: "Bricolage Grotesque", file: "fonts/bric-800-lat.woff2", weight: "800", range: LATIN },
  { family: "Bricolage Grotesque", file: "fonts/bric-800-ext.woff2", weight: "800", range: LATIN_EXT },
  { family: "JetBrains Mono", file: "fonts/jb-500-lat.woff2", weight: "500", range: LATIN },
  { family: "JetBrains Mono", file: "fonts/jb-500-ext.woff2", weight: "500", range: LATIN_EXT },
];

/** Loads the brand fonts before Remotion captures a frame. SIL Open Font License. */
export function Fonts() {
  const [handle] = useState(() => delayRender("brand fonts"));

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      FACES.map(async (def) => {
        const face = new FontFace(def.family, `url(${staticFile(def.file)})`, {
          weight: def.weight,
          style: "normal",
          unicodeRange: def.range,
        });
        document.fonts.add(await face.load());
      }),
    )
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (!cancelled) continueRender(handle);
      });
    return () => {
      cancelled = true;
    };
  }, [handle]);

  return null;
}
