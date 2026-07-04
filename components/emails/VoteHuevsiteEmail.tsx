import * as React from "react";
import { EmailLayout } from "./EmailLayout";

interface VoteHuevsiteEmailProps {
  /** Deep link to the launch card (scrolls + highlights it). UTM appended here. */
  launchUrl: string;
  unsubscribeUrl: string;
}

const ACCENT = "#C8FF00";

// One-shot campaign: huevsite launched itself on its own Builders Hunt week and
// asks the community for the upvote. Send via /api/admin/send-vote-huevsite.
export const VoteHuevsiteEmail: React.FC<VoteHuevsiteEmailProps> = ({
  launchUrl,
  unsubscribeUrl,
}) => (
  <EmailLayout previewText="huevsite está compitiendo en su propio Builders Hunt y la semana cierra el domingo. Tu voto lo define.">
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
        // builders hunt
      </div>
      <h2 style={{ fontSize: "30px", fontWeight: 800, margin: "0 0 12px", lineHeight: 1.15, color: "#fff" }}>
        Lancé huevsite en Builders Hunt.
      </h2>
      <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#a1a1aa", margin: "0 auto", maxWidth: "440px" }}>
        Esta semana huevsite compite en su propio feed de lanzamientos, junto a los proyectos de
        la comunidad. <strong style={{ color: "#fff" }}>La semana cierra el domingo</strong> y el
        ganador lo definen los votos.
      </p>
    </div>

    {/* WHY — founder voice */}
    <div style={{ padding: "28px 4px 8px", fontSize: "15px", lineHeight: 1.7, color: "#d4d4d8" }}>
      <p style={{ margin: "0 0 16px" }}>
        Soy Tomás. Puse a huevsite a jugar en su propia cancha: sin trato especial, se rankea con
        votos como cualquier lanzamiento. Si el producto te sirvió aunque sea una vez, tu voto es
        la mejor forma de decirlo. Tarda 5 segundos: el link te lleva directo a la card y la
        ilumina para que no la busques.
      </p>
    </div>

    {/* CTA */}
    <div style={{ textAlign: "center", marginTop: "12px", marginBottom: "20px" }}>
      <a
        href={launchUrl}
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
        ▲ Votar huevsite en Builders Hunt
      </a>
      <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#71717a", marginTop: "10px" }}>
        cierra el domingo · un click y listo
      </div>
    </div>

    {/* COMMUNITY NUDGE */}
    <div
      style={{
        border: "1px solid #1a1a1a",
        borderRadius: "16px",
        padding: "16px 20px",
        background: "rgba(255,255,255,0.02)",
        fontSize: "14px",
        lineHeight: 1.6,
        color: "#d4d4d8",
      }}
    >
      🚀 Ya que estás ahí: mirá lo que lanzaron otros builders esta semana y votá lo que te
      guste. Y si tenés un proyecto listo, lanzalo la semana que viene desde tu dashboard.
    </div>

    {/* UNSUBSCRIBE */}
    <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "20px", marginTop: "24px", textAlign: "center" }}>
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
