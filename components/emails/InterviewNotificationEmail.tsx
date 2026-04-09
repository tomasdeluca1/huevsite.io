import * as React from "react";
import { EmailLayout } from "./EmailLayout";

interface InterviewNotificationEmailProps {
  builderName: string;
  builderUsername: string;
  blogTitle: string;
  blogExcerpt: string;
  xDraftUrl: string | null;
  linkedinDraftUrl: string | null;
  adminUrl: string;
}

export const InterviewNotificationEmail: React.FC<
  Readonly<InterviewNotificationEmailProps>
> = ({
  builderName,
  builderUsername,
  blogTitle,
  blogExcerpt,
  xDraftUrl,
  linkedinDraftUrl,
  adminUrl,
}) => (
  <EmailLayout
    previewText={`${builderName} completó la entrevista Builder de la Semana`}
  >
    <div style={{ textAlign: "center", marginBottom: "32px" }}>
      <div style={{ fontSize: "36px", marginBottom: "12px" }}>🎙️</div>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "800",
          margin: "0 0 4px 0",
        }}
      >
        Nueva entrevista lista
      </h2>
      <p style={{ color: "#a1a1aa", margin: "0", fontSize: "14px" }}>
        <strong style={{ color: "#C8FF00" }}>
          {builderName} (@{builderUsername})
        </strong>{" "}
        completó el formulario
      </p>
    </div>

    {/* Blog preview */}
    <div
      style={{
        padding: "24px",
        borderRadius: "16px",
        border: "1px solid rgba(200, 255, 0, 0.15)",
        background: "rgba(200, 255, 0, 0.04)",
        marginBottom: "20px",
      }}
    >
      <p
        style={{
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#C8FF00",
          margin: "0 0 8px 0",
        }}
      >
        Blog Post Generado
      </p>
      <p
        style={{
          fontSize: "18px",
          fontWeight: "700",
          color: "#ffffff",
          margin: "0 0 8px 0",
        }}
      >
        {blogTitle}
      </p>
      <p
        style={{
          fontSize: "14px",
          color: "#a1a1aa",
          lineHeight: "1.5",
          margin: "0",
        }}
      >
        {blogExcerpt}
      </p>
    </div>

    {/* Draft links */}
    <div
      style={{
        display: "flex",
        gap: "12px",
        marginBottom: "24px",
      }}
    >
      {xDraftUrl && (
        <a
          href={xDraftUrl}
          style={{
            flex: "1",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #27272a",
            textDecoration: "none",
            textAlign: "center",
            fontSize: "13px",
            color: "#a1a1aa",
          }}
        >
          <span style={{ display: "block", fontSize: "18px", marginBottom: "4px" }}>𝕏</span>
          Ver draft en X
        </a>
      )}
      {linkedinDraftUrl && (
        <a
          href={linkedinDraftUrl}
          style={{
            flex: "1",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #27272a",
            textDecoration: "none",
            textAlign: "center",
            fontSize: "13px",
            color: "#a1a1aa",
          }}
        >
          <span style={{ display: "block", fontSize: "18px", marginBottom: "4px" }}>in</span>
          Ver draft en LinkedIn
        </a>
      )}
    </div>

    {/* CTA */}
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
        Revisar y publicar →
      </a>
    </div>
  </EmailLayout>
);
