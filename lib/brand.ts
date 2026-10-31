/**
 * La tabla de marca de huevsite.io: una sola fuente de verdad para el color y
 * la tipografía. El CSS no puede importar TS, así que `app/globals.css` repite
 * estos valores como custom properties y `scripts/verify-brand-tokens.js` falla
 * si las dos caras se separan.
 *
 * Esto lo importa código que corre en el edge (las imágenes OG): solo
 * constantes, sin imports, sin `fs` y sin `process`.
 *
 * La rampa de grises es la que había, bajada hasta tres puntos para que el
 * negro de marca sea #050505: los escalones se conservan y ningún perfil ya
 * publicado cambia de aspecto.
 */
export const BRAND = {
  color: {
    bg: "#050505",
    surface: "#0E0E0F",
    surface2: "#171718",
    border: "#202022",
    borderBright: "#303033",

    accent: "#C8FF00",
    accentDim: "rgba(200, 255, 0, 0.12)",
    accentMid: "rgba(200, 255, 0, 0.3)",
    /** El gris del isotipo. Es lo que evita que el lima grite solo. */
    slate: "#4A4949",

    text: "#f0f0f0",
    textStrong: "#ffffff",
    textDim: "#D1D1D1",
    textMuted: "#888888",

    red: "#FF3B3B",
    blue: "#4D9FFF",
    purple: "#A855F7",
    orange: "#FF7A00",
  },

  /**
   * La escala. El mono (JetBrains) se usa de `monoMaxStep` para abajo —
   * etiquetas, URLs y métricas— y nunca para texto corrido: eso es lo que hace
   * que la marca se lea "solo para devs".
   */
  type: {
    display: "clamp(40px, 7vw, 72px)",
    h1: "clamp(30px, 5vw, 46px)",
    h2: "clamp(22px, 3.4vw, 30px)",
    h3: "20px",
    body: "16px",
    sm: "14px",
    label: "12px",
    micro: "10px",
  },
  monoMaxStep: "label",
} as const
