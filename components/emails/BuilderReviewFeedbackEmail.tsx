import * as React from "react";
import { EmailLayout } from "./EmailLayout";

interface BuilderReviewFeedbackEmailProps {
  builderName: string;
  builderUsername: string;
  approved: boolean;
  feedback: string | null;
  adminUrl: string;
}

export const BuilderReviewFeedbackEmail: React.FC<
  Readonly<BuilderReviewFeedbackEmailProps>
> = ({ builderName, builderUsername, approved, feedback, adminUrl }) => (
  <EmailLayout
    previewText={`${builderName} ${
      approved ? "aprobó" : "pidió cambios en"
    } su entrevista`}
  >
    <div style={{ textAlign: "center", marginBottom: "32px" }}>
      <div style={{ fontSize: "36px", marginBottom: "12px" }}>
        {approved ? "✅" : "✍️"}
      </div>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "800",
          margin: "0 0 4px 0",
        }}
      >
        {approved ? "Aprobó la entrevista" : "Pidió cambios"}
      </h2>
      <p style={{ color: "#a1a1aa", margin: "0", fontSize: "14px" }}>
        <strong style={{ color: "#C8FF00" }}>
          {builderName} (@{builderUsername})
        </strong>{" "}
        revisó el contenido generado
      </p>
    </div>

    {feedback && (
      <div
        style={{
          padding: "24px",
          borderRadius: "16px",
          border: "1px solid rgba(200, 255, 0, 0.15)",
          background: "rgba(200, 255, 0, 0.04)",
          marginBottom: "24px",
        }}
      >
        <p
          style={{
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#C8FF00",
            margin: "0 0 12px 0",
          }}
        >
          Feedback del builder
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "#e4e4e7",
            lineHeight: "1.6",
            margin: "0",
            whiteSpace: "pre-wrap",
          }}
        >
          {feedback}
        </p>
      </div>
    )}

    {!feedback && approved && (
      <p
        style={{
          textAlign: "center",
          color: "#a1a1aa",
          fontSize: "14px",
          marginBottom: "24px",
        }}
      >
        Sin comentarios adicionales. Todo listo para publicar 🚀
      </p>
    )}

    <div style={{ textAlign: "center" }}>
      <a
        href={adminUrl}
        style={{
          backgroundColor: "#C8FF00",
          color: "#000000",
          padding: "14px 28px",
          borderRadius: "12px",
          fontWeight: "bold",
          textDecoration: "none",
          display: "inline-block",
          fontSize: "15px",
        }}
      >
        Abrir en admin →
      </a>
    </div>
  </EmailLayout>
);
