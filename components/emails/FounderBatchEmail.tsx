import * as React from "react";
import { EmailLayout } from "./EmailLayout";

interface FounderBatchEmailProps {
  /** Live remaining seats (cap - lifetime buyers), computed at send time. */
  remaining: number;
  cap: number;
  nextPrice: string;
  unsubscribeUrl: string;
}

const ACCENT = "#C8FF00";
const SITE = "https://huevsite.io";
const UTM = "utm_source=email&utm_medium=email&utm_campaign=founder-batch";

// One-time Founder batch announcement: $79 lifetime, capped seats, price moves
// to nextPrice when they run out. Send via /api/admin/send-founder-batch —
// `remaining` is counted live from profiles.is_lifetime so scarcity is real.
export const FounderBatchEmail: React.FC<FounderBatchEmailProps> = ({
  remaining,
  cap,
  nextPrice,
  unsubscribeUrl,
}) => (
  <EmailLayout previewText={`Quedan ${remaining} lugares Founder a $79. Después pasa a ${nextPrice}.`}>
    {/* HEADER */}
    <div
      style={{
        background: "linear-gradient(180deg, rgba(200, 255, 0, 0.1) 0%, transparent 100%)",
        padding: "40px 32px",
        borderRadius: "24px",
        textAlign: "center",
        border: "1px solid rgba(200, 255, 0, 0.2)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontFamily: "monospace",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: ACCENT,
          marginBottom: "12px",
        }}
      >
        // founder batch
      </div>
      <h2 style={{ fontSize: "30px", fontWeight: 800, margin: "0 0 12px", lineHeight: 1.15, color: "#fff" }}>
        Quedan {remaining} lugares Founder.
      </h2>
      <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#a1a1aa", margin: "0 auto", maxWidth: "440px" }}>
        $79 una sola vez, Pro para siempre. Cuando se llenen los {cap} lugares, el precio pasa a{" "}
        <strong style={{ color: "#fff" }}>{nextPrice}</strong> y no vuelve.
      </p>
    </div>

    {/* WHY — founder voice */}
    <div style={{ padding: "28px 4px 8px", fontSize: "15px", lineHeight: 1.7, color: "#d4d4d8" }}>
      <p style={{ margin: "0 0 16px" }}>
        Soy Tomás. huevsite es open source y lo banco yo: cada Founder financia que la red siga
        gratis para todos los builders que se suman. A cambio, te llevás lo mejor del producto
        para siempre y un lugar en la historia del proyecto.
      </p>
    </div>

    {/* WHAT YOU GET */}
    <div style={{ padding: "4px 0 8px" }}>
      {[
        { emoji: "⚡", text: "Todo lo de Pro, de por vida: dominio propio, insights, 22 bloques, sub-sitios y aparecer primero en el feed, el showcase y el ranking." },
        { emoji: "🚫", text: "Cero mensualidad. Pagás una vez y no pensás nunca más en otra suscripción." },
        { emoji: "🥚", text: "Badge Founder exclusivo en tu perfil: fuiste de los primeros que apostaron." },
      ].map((item, i) => (
        <div
          key={i}
          style={{
            border: "1px solid #1a1a1a",
            borderRadius: "16px",
            padding: "16px 20px",
            marginBottom: "10px",
            background: "rgba(255,255,255,0.02)",
            fontSize: "14px",
            lineHeight: 1.6,
            color: "#d4d4d8",
          }}
        >
          {item.emoji} {item.text}
        </div>
      ))}
    </div>

    {/* PRICE ANCHOR */}
    <div style={{ textAlign: "center", padding: "16px 0 4px" }}>
      <span style={{ fontSize: "15px", color: "#71717a", textDecoration: "line-through", marginRight: "10px" }}>
        {nextPrice} después
      </span>
      <span style={{ fontSize: "26px", fontWeight: 800, color: ACCENT }}>$79 hoy</span>
      <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#71717a", marginTop: "6px" }}>
        pago único · sin recurrencia · quedan {remaining} de {cap}
      </div>
    </div>

    {/* CTA */}
    <div style={{ textAlign: "center", marginTop: "20px", marginBottom: "24px" }}>
      <a
        href={`${SITE}/precios?${UTM}`}
        style={{
          backgroundColor: ACCENT,
          color: "#000",
          padding: "16px 36px",
          borderRadius: "12px",
          fontWeight: "bold",
          textDecoration: "none",
          display: "inline-block",
          fontSize: "16px",
        }}
      >
        Quiero mi lugar Founder →
      </a>
    </div>

    {/* UNSUBSCRIBE */}
    <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "20px", textAlign: "center" }}>
      <p style={{ fontSize: "12px", lineHeight: 1.6, color: "#52525b", margin: 0 }}>
        Recibís este email porque tenés una cuenta en huevsite.io.{" "}
        <a href={unsubscribeUrl} style={{ color: "#71717a", textDecoration: "underline" }}>
          Darme de baja de estos avisos
        </a>
        .
      </p>
    </div>
  </EmailLayout>
);
