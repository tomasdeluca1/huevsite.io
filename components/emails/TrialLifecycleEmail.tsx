import * as React from "react";
import { EmailLayout } from "./EmailLayout";

interface TrialLifecycleEmailProps {
  eyebrow?: string;
  title: string;
  body: string;
  cta: string;
  ctaHref: string;
  previewText?: string;
}

export const TrialLifecycleEmail: React.FC<TrialLifecycleEmailProps> = ({
  eyebrow,
  title,
  body,
  cta,
  ctaHref,
  previewText,
}) => (
  <EmailLayout previewText={previewText}>
    <div
      style={{
        background: "linear-gradient(180deg, rgba(200, 255, 0, 0.12) 0%, transparent 100%)",
        padding: "40px",
        borderRadius: "24px",
        border: "1px solid rgba(200, 255, 0, 0.18)",
        textAlign: "center",
      }}
    >
      {eyebrow ? (
        <div style={{ color: "#C8FF00", fontSize: "12px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "12px" }}>
          {eyebrow}
        </div>
      ) : null}
      <h2 style={{ color: "#fff", fontSize: "30px", lineHeight: "1.15", margin: "0 0 14px 0", fontWeight: 900 }}>
        {title}
      </h2>
      <p style={{ color: "#d4d4d8", fontSize: "16px", lineHeight: "1.7", margin: "0 auto", maxWidth: "520px" }}>
        {body}
      </p>
    </div>

    <div style={{ textAlign: "center", marginTop: "28px" }}>
      <a
        href={ctaHref}
        style={{
          backgroundColor: "#C8FF00",
          color: "#000",
          padding: "16px 32px",
          borderRadius: "14px",
          fontWeight: 800,
          textDecoration: "none",
          display: "inline-block",
          fontSize: "16px",
        }}
      >
        {cta}
      </a>
    </div>
  </EmailLayout>
);
