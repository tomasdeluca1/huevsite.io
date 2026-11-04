import * as React from "react";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/site-url";

export const FOUNDER_MAIL1_SUBJECT = "🥚 Founder de huevsite: Pro para siempre, USD 79 una vez";

export const FOUNDER_MAIL1_CTA =
  "https://huevsite.io/precios?utm_source=email&utm_medium=email&utm_campaign=founder&utm_content=mail1";

/** Replaced per recipient. Kept ASCII so the renderer cannot escape it. */
export const FOUNDER_MAIL1_NAME_MARKER = "%%HUEVSITE_NAME%%";
export const FOUNDER_MAIL1_UNSUB_MARKER = "%%HUEVSITE_UNSUB%%";

export function founderMail1PreviewText(remaining: number): string {
  return `20 lugares a USD 79, después USD 129. Quedan ${remaining}.`;
}

interface FounderMail1EmailProps {
  /** Live seats still open. The route refuses to send when this is 0. */
  remaining: number;
  /** Display name, or FOUNDER_MAIL1_NAME_MARKER when the route personalizes later. */
  name: string;
  /** buildUnsubscribeUrl(userId), or FOUNDER_MAIL1_UNSUB_MARKER. */
  unsubscribeUrl: string;
}

const FEATURES = [
  "Insights: quién te visitó y qué miró",
  "Tu propio dominio",
  "Hasta 22 bloques en tu grid (en free son 5)",
  "Launches ilimitados y siempre destacados en Builders Hunt",
  "Más visibilidad en el feed, el showcase y el ranking",
  "Acceso anticipado a las features nuevas, antes que nadie",
  "Soporte personalizado, directo conmigo",
];

// Official header lockup from https://www.premiostech.la/ (apex redirects here):
// /site/logo-techla.*.svg + /site/logo-2026.*.svg, fill #FBF5F5, on --naranja-reflector #ED6025.
const PREMIOS_URL = "https://www.premiostech.la/";
const PREMIOS_LOGO = "https://huevsite.io/premiostech-2026-logo.png";

const bodyText: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: BRAND.color.text,
  margin: "0 0 16px",
};

// Mail 1 · Lanzamiento. Section 2.2 copy, minus sub-sites (that feature is
// being dropped) and plus two Founder-only lines. Lime is only the // founder
// label and the CTA. No gradient, no glow, no Founder badge. Background is
// the brand black.
export const FounderMail1Email: React.FC<FounderMail1EmailProps> = ({
  remaining,
  name,
  unsubscribeUrl,
}) => (
  <div
    style={{
      backgroundColor: BRAND.color.bg,
      margin: 0,
      padding: "28px 16px 40px",
      fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    }}
  >
    <div style={{ display: "none", maxHeight: 0, overflow: "hidden", opacity: 0 }}>
      {founderMail1PreviewText(remaining)}
    </div>

    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${SITE_URL}/logo-huevsite.png`}
        alt="huevsite.io"
        width={164}
        height={40}
        style={{ display: "block", width: "164px", height: "auto", border: 0, margin: "0 0 28px" }}
      />

      <div
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: "12px",
          letterSpacing: "0.04em",
          color: BRAND.color.accent,
          margin: "0 0 20px",
        }}
      >
        // founder
      </div>

      <p style={bodyText}>{name ? `Hola ${name},` : "Hola,"}</p>

      <p style={bodyText}>Soy Tomás. Te escribo por dos cosas.</p>

      <p style={bodyText}>
        La primera: huevsite.io quedó nominado a los PremiosTech.la en la categoría Comunidad. Eso no
        es mérito de un producto, es de los más de 300 builders que armaron su perfil y shippean en
        público. Gracias.
      </p>

      <a
        href={PREMIOS_URL}
        style={{ textDecoration: "none", display: "inline-block", margin: "0 0 20px", maxWidth: "100%" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PREMIOS_LOGO}
          alt="Premios Tech.La 2026 — nominados en Comunidad"
          width={200}
          height={118}
          style={{ display: "block", width: "200px", maxWidth: "100%", height: "auto", border: 0 }}
        />
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: "12px",
            lineHeight: 1.4,
            color: "#FBF5F5",
            marginTop: "8px",
          }}
        >
          Nominados · Comunidad
        </div>
      </a>

      <p style={bodyText}>
        La segunda: quiero que esta red siga gratis para todos los que se suman. Por eso hay un plan
        Founder.
      </p>

      <p style={bodyText}>Founder es todo lo de Pro, para siempre, pagando una sola vez:</p>

      <div style={{ margin: "0 0 16px" }}>
        {FEATURES.map((line) => (
          <div key={line} style={{ ...bodyText, margin: "0 0 6px" }}>
            · {line}
          </div>
        ))}
      </div>

      <p style={bodyText}>
        Pro sale USD 9 por mes. Founder sale USD 79 una vez: en el mes 9 ya está pago.
      </p>

      <p style={bodyText}>
        {`Son 20 lugares a USD 79, después USD 129. Hoy quedan ${remaining}.`}
      </p>

      <div style={{ margin: "8px 0 24px" }}>
        <a
          href={FOUNDER_MAIL1_CTA}
          style={{
            backgroundColor: BRAND.color.accent,
            color: "#000000",
            padding: "16px 28px",
            borderRadius: "12px",
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-block",
            fontSize: "16px",
            lineHeight: 1.2,
          }}
        >
          Quiero mi lugar Founder
        </a>
      </div>

      <p style={bodyText}>
        huevsite es open source y lo banco yo. Cada Founder paga servidores y tiempo para seguir
        shippeando.
      </p>

      <p style={{ ...bodyText, margin: "0 0 4px" }}>Tomás</p>
      <p style={{ ...bodyText, margin: "0 0 28px" }}>Mostrá lo que shippeás. Que te encuentren.</p>

      <div style={{ borderTop: `1px solid ${BRAND.color.border}`, paddingTop: "20px" }}>
        <p style={bodyText}>Recibís este mail porque tenés una cuenta en huevsite.io.</p>
        <p style={{ ...bodyText, margin: 0 }}>
          Si no querés recibir más mails como este, date de baja acá:{" "}
          <a
            href={unsubscribeUrl}
            style={{ color: BRAND.color.text, fontSize: "16px", textDecoration: "underline", wordBreak: "break-all" }}
          >
            {unsubscribeUrl}
          </a>
        </p>
      </div>
    </div>
  </div>
);

export function escapeMail1Html(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Swap the two markers for this recipient. Refuses to return a half-filled body. */
export function fillFounderMail1Html(
  html: string,
  opts: { name: string; unsubscribeUrl: string }
): string {
  const name = opts.name.trim();
  const greeting = name ? `Hola ${escapeMail1Html(name)},` : "Hola,";
  const needle = `Hola ${FOUNDER_MAIL1_NAME_MARKER},`;
  if (!html.includes(needle) || !html.includes(FOUNDER_MAIL1_UNSUB_MARKER)) {
    throw new Error("Mail 1 template is missing a personalization marker");
  }
  const filled = html
    .replaceAll(needle, greeting)
    .replaceAll(FOUNDER_MAIL1_UNSUB_MARKER, escapeMail1Html(opts.unsubscribeUrl));
  if (filled.includes(FOUNDER_MAIL1_NAME_MARKER) || filled.includes(FOUNDER_MAIL1_UNSUB_MARKER)) {
    throw new Error("Mail 1 personalization markers survived render");
  }
  return filled;
}
