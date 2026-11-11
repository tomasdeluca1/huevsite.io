import { ImageResponse } from "next/og";
import {
  ACCENT,
  BORDER,
  TEXT_DIM,
  TEXT_MUTED,
  truncate,
  Texture,
  InnerBorder,
  OgLogo,
  AvatarCircle,
  BrandFallback,
  fetchAvanceOg,
  type AvanceOg,
} from "@/lib/og/shared";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Imagen del post de Instagram del cron de avances builders. Formato 4:5
// (1080x1350), el que IG muestra entero en el feed. El protagonista es el
// proyecto: su captura, qué es, en qué anda y con qué está hecho. La persona
// aparece chica, como autora. Nunca da 500: si algo falla, sale la imagen de marca.
const IG_SIZE = { width: 1080, height: 1350 };

const KIND_LABEL: Record<AvanceOg["kind"], string> = {
  launch: "Lanzamiento",
  new_project: "Proyecto nuevo",
  update: "Avance",
};

const STATUS_LABEL: Record<string, string> = {
  idea: "idea",
  building: "en construcción",
  launched: "lanzado",
};

// Proxy de imágenes con tamaño fijo y recorte, para que Satori no reciba
// formatos raros (webp/svg) ni imágenes enormes.
function proxied(src: string | null, w: number, h: number): string | null {
  if (!src || !/^https:\/\//i.test(src)) return null;
  return `https://images.weserv.nl/?url=${encodeURIComponent(src)}&w=${w * 2}&h=${h * 2}&fit=cover&output=jpg`;
}

function hostOf(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function Pill({ children, strong = false }: { children: any; strong?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 20px",
        borderRadius: 999,
        fontSize: 22,
        fontWeight: 800,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        background: strong ? ACCENT : "rgba(255,255,255,0.06)",
        color: strong ? "#0a0a0f" : TEXT_DIM,
        border: strong ? "none" : `1px solid ${BORDER}`,
      }}
    >
      {children}
    </div>
  );
}

function Shot({ og }: { og: AvanceOg }) {
  const shot = og.imageMode === "favicon" ? null : proxied(og.imageUrl, 952, 500);
  if (shot) {
    return (
      <img
        src={shot}
        width={952}
        height={500}
        style={{ width: 952, height: 500, borderRadius: 28, objectFit: "cover", border: `1px solid ${BORDER}` }}
      />
    );
  }
  // Sin captura: tarjeta con la inicial del proyecto sobre el acento.
  return (
    <div
      style={{
        width: 952,
        height: 500,
        borderRadius: 28,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        background: `linear-gradient(135deg, ${ACCENT}33, rgba(255,255,255,0.03))`,
        border: `1px solid ${ACCENT}40`,
      }}
    >
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: ACCENT,
          color: "#0a0a0f",
          fontSize: 110,
          fontWeight: 900,
        }}
      >
        {(og.title || "?").charAt(0).toUpperCase()}
      </div>
      {og.link ? (
        <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: TEXT_DIM }}>{hostOf(og.link)}</div>
      ) : null}
    </div>
  );
}

export async function GET(request: Request, { params }: { params: { blockId: string } }) {
  const url = new URL(request.url);
  const kindParam = url.searchParams.get("kind");
  const kind: AvanceOg["kind"] = kindParam === "launch" || kindParam === "new_project" ? kindParam : "update";
  try {
    const og = await fetchAvanceOg(params.blockId, kind, url.searchParams.get("launch"));
    if (!og) return new ImageResponse(<BrandFallback />, { ...IG_SIZE });

    // En un avance, la nota es la noticia; si no hay nota, va la descripción.
    const body = og.kind === "update" && og.note ? og.note : og.description;
    const quoted = og.kind === "update" && !!og.note;
    const status = STATUS_LABEL[og.status] || "";

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "60px 64px",
            background: "#0a0a0f",
            color: "white",
            position: "relative",
          }}
        >
          <Texture />
          <InnerBorder />
          <div style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative", zIndex: 1 }}>
            {/* Marca + qué tipo de post es */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <OgLogo height={44} />
              <Pill strong>{KIND_LABEL[og.kind]}</Pill>
            </div>

            {/* El proyecto */}
            <div style={{ display: "flex", marginTop: 44 }}>
              <Shot og={og} />
            </div>

            {status ? (
              <div style={{ display: "flex", marginTop: 36 }}>
                <Pill>{status}</Pill>
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                marginTop: status ? 18 : 40,
                fontSize: 76,
                fontWeight: 900,
                letterSpacing: "-0.045em",
                lineHeight: 1.02,
              }}
            >
              {truncate(og.title, 40)}
            </div>

            {body ? (
              <div
                style={{
                  display: "flex",
                  marginTop: 24,
                  paddingLeft: quoted ? 24 : 0,
                  borderLeft: quoted ? `4px solid ${ACCENT}` : "none",
                  fontSize: 32,
                  lineHeight: 1.38,
                  fontWeight: 500,
                  color: quoted ? "white" : TEXT_DIM,
                }}
              >
                {truncate(body, 150)}
              </div>
            ) : null}

            {og.stack.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
                {og.stack.slice(0, 5).map((tech) => (
                  <div
                    key={tech}
                    style={{
                      display: "flex",
                      padding: "8px 16px",
                      borderRadius: 12,
                      fontSize: 22,
                      fontWeight: 700,
                      color: TEXT_DIM,
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    {truncate(tech, 22)}
                  </div>
                ))}
              </div>
            ) : null}

            <div style={{ display: "flex", flex: 1 }} />

            {/* Quién lo hace + dónde verlo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 28,
                borderTop: `1px solid ${BORDER}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <AvatarCircle url={og.avatar} name={og.name} size={64} accent={ACCENT} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", fontSize: 28, fontWeight: 800 }}>{truncate(og.name, 28)}</div>
                  <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: TEXT_MUTED }}>
                    {og.kind === "launch" && og.upvotes > 0 ? `@${og.username} · ${og.upvotes} votos` : `@${og.username}`}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: ACCENT,
                }}
              >
                {og.kind === "launch" ? "huevsite.io/feed" : `huevsite.io/${truncate(og.username, 18)}`}
              </div>
            </div>
          </div>
        </div>
      ),
      { ...IG_SIZE }
    );
  } catch {
    return new ImageResponse(<BrandFallback />, { ...IG_SIZE });
  }
}
