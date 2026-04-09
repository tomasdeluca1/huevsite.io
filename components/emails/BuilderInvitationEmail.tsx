import * as React from "react";
import { EmailLayout } from "./EmailLayout";

interface BuilderInvitationEmailProps {
  name: string;
  username: string;
  formUrl: string;
}

export const BuilderInvitationEmail: React.FC<
  Readonly<BuilderInvitationEmailProps>
> = ({ name, username, formUrl }) => (
  <EmailLayout
    previewText={`${name}, fuiste elegido como Builder de la Semana en huevsite.io`}
  >
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(200, 255, 0, 0.1) 0%, transparent 100%)",
        padding: "40px",
        borderRadius: "24px",
        textAlign: "center",
        border: "1px solid rgba(200, 255, 0, 0.2)",
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎙️</div>
      <h2
        style={{
          fontSize: "28px",
          fontWeight: "800",
          margin: "0 0 8px 0",
          lineHeight: "1.1",
        }}
      >
        ¡Sos el Builder de la Semana!
      </h2>
      <p
        style={{
          color: "#C8FF00",
          fontWeight: "bold",
          margin: "0",
          fontSize: "14px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        @{username}
      </p>
    </div>

    <div style={{ padding: "32px 0", textAlign: "center" }}>
      <p style={{ fontSize: "18px", lineHeight: "1.6", color: "#a1a1aa" }}>
        Hola <strong>{name}</strong>, la comunidad te eligió y queremos contar
        tu historia. Completá un formulario corto contándonos sobre vos y lo que
        estás buildeando.
      </p>

      <p
        style={{
          fontSize: "15px",
          lineHeight: "1.6",
          color: "#71717a",
          marginTop: "24px",
        }}
      >
        Con tus respuestas vamos a armar un blog post, un post en LinkedIn y uno
        en X para que la comunidad conozca tu trabajo.
      </p>
    </div>

    <div style={{ textAlign: "center", marginTop: "16px" }}>
      <a
        href={formUrl}
        style={{
          backgroundColor: "#C8FF00",
          color: "#000000",
          padding: "16px 32px",
          borderRadius: "12px",
          fontWeight: "bold",
          textDecoration: "none",
          display: "inline-block",
          fontSize: "16px",
        }}
      >
        Completar entrevista →
      </a>
    </div>

    <div
      style={{
        marginTop: "40px",
        padding: "24px",
        borderRadius: "16px",
        border: "1px solid rgba(200, 255, 0, 0.1)",
        background: "rgba(255, 255, 255, 0.02)",
      }}
    >
      <p
        style={{
          fontSize: "14px",
          fontWeight: "700",
          color: "#e4e4e7",
          margin: "0 0 12px 0",
        }}
      >
        ¿Qué te vamos a preguntar?
      </p>
      <ul
        style={{
          fontSize: "13px",
          color: "#a1a1aa",
          lineHeight: "1.8",
          paddingLeft: "16px",
          margin: "0",
        }}
      >
        <li>Quién sos y cómo arrancaste a buildear</li>
        <li>En qué proyecto estás laburando y qué problema resuelve</li>
        <li>Qué significa build in public para vos</li>
        <li>Herramientas, inspiraciones y consejos rápidos</li>
      </ul>
      <p
        style={{
          fontSize: "12px",
          color: "#52525b",
          marginTop: "16px",
          margin: "16px 0 0 0",
        }}
      >
        Son ~10 minutos. El link expira en 7 días.
      </p>
    </div>
  </EmailLayout>
);
