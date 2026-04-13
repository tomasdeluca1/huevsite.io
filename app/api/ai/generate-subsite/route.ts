import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { hasProAccess } from "@/lib/pro-access";
import OpenAI from "openai";
import { scoreService } from "@/lib/score-service";

export const maxDuration = 60; // Set max duration to 60s for Vercel
export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function ensureAbsoluteUrl(input: string) {
  if (!input) return "";
  if (/^https?:\/\//i.test(input)) return input;
  return `https://${input}`;
}

function extractFaviconCandidates(html: string, pageUrl: string) {
  const candidates = new Set<string>();

  try {
    const origin = new URL(pageUrl).origin;
    candidates.add(`${origin}/favicon.ico`);

    const iconRegex = /<link[^>]+rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
    const matches = Array.from(html.matchAll(iconRegex));
    for (const match of matches) {
      const href = match[1];
      if (!href) continue;
      try {
        candidates.add(new URL(href, pageUrl).toString());
      } catch {
        // Ignore invalid candidate URLs
      }
    }
  } catch {
    // Ignore parsing errors
  }

  return Array.from(candidates);
}

async function resolveFaviconUrl(url: string, pageHtml?: string) {
  const normalizedUrl = ensureAbsoluteUrl(url);
  const candidates = new Set<string>();

  try {
    const parsedUrl = new URL(normalizedUrl);
    candidates.add(`https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=128`);
  } catch {
    // Ignore invalid URL
  }

  for (const candidate of extractFaviconCandidates(pageHtml || "", normalizedUrl)) {
    candidates.add(candidate);
  }

  for (const candidate of Array.from(candidates)) {
    try {
      const response = await fetch(candidate, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 huevsite favicon fetcher",
        },
      });

      if (!response.ok) continue;

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) continue;

      const bytes = await response.arrayBuffer();
      if (bytes.byteLength === 0) continue;

      return {
        sourceUrl: candidate,
        bytes,
        contentType,
      };
    } catch {
      // Try next candidate
    }
  }

  return null;
}

const subSiteJsonSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "A short, catchy title for the sub-site (e.g., the product name).",
    },
    tagline: {
      type: "string",
      description: "A one-liner tagline that describes the sub-site (max 80 chars). Used as the sub-site profile description.",
    },
    slug: {
      type: "string",
      description: "A URL-friendly slug based on the title (lowercase, hyphens only).",
    },
    blocks: {
      type: "array",
      description: "An array of blocks that make up the sub-site content.",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "The type of block. Allowed values: 'hero', 'metric', 'custom', 'building', 'writing', 'project', 'media'.",
          },
          label: {
            type: ["string", "null"],
            description: "A small uppercase label. For type 'media', this is the caption.",
          },
          title: {
            type: "string",
            description: "Main heading.",
          },
          description: {
            type: "string",
            description: "Body text. For type 'media', keep it very short or null.",
          },
          value: {
            type: ["string", "null"],
            description: "For 'metric' blocks (e.g., '10k').",
          },
          link: {
            type: ["string", "null"],
            description: "External URL.",
          },
          imageUrl: {
            type: ["string", "null"],
            description: "IMAGE URL. Crucial for 'project' and 'media' types.",
          },
          stack: {
            type: ["array", "null"],
            description: "Tech stack for 'building' blocks.",
            items: { type: "string" },
          },
        },
        required: ["type", "title", "description", "label", "value", "link", "imageUrl", "stack"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "tagline", "slug", "blocks"],
  additionalProperties: false,
};

export async function POST(request: NextRequest) {
  try {
    const sessionClient = await createClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // After auth, service-role for all DB work. Reads cover trial/subscription
    // columns that `authenticated` can't SELECT after the 2026-04-11 hardening,
    // and writes hit sub_sites/blocks which may otherwise fail the .select()
    // round-trip. All queries scoped to user.id.
    const supabase = createServiceRoleClient();

    // Check if user is PRO
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, pro_since, referral_reward_expires_at, free_trial_claimed_at, free_trial_started_at, free_trial_ends_at, free_trial_last_insights_viewed_at")
      .eq("id", user.id)
      .single();

    if (!profile || !hasProAccess(profile)) {
      return NextResponse.json({ error: "Esta función es exclusiva para usuarios PRO." }, { status: 403 });
    }

    const { url: rawUrl } = await request.json();
    const url = ensureAbsoluteUrl(rawUrl);

    if (!url) {
      return NextResponse.json({ error: "Falta la URL" }, { status: 400 });
    }

    // 1. Fetch content from Jina
    console.log(`Fetching content from Jina for: ${url}`);
    const jinaResponse = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
      headers: {
        "Accept": "text/plain",
      }
    });

    if (!jinaResponse.ok) {
      throw new Error(`Jina API error: ${jinaResponse.status}`);
    }

    const pageContent = await jinaResponse.text();
    const truncatedContent = pageContent.slice(0, 15000);

    // Extract OG/Twitter image
    let ogImageUrl = "";
    try {
      const metaMatches = {
        ogImage: pageContent.match(/og:image:?\s*(https?:\/\/[^\s\n\r"'>]+)/i),
        twitterImage: pageContent.match(/twitter:image:?\s*(https?:\/\/[^\s\n\r"'>]+)/i),
        firstMarkdownImage: pageContent.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/),
      };
      ogImageUrl = metaMatches.ogImage?.[1] || metaMatches.twitterImage?.[1] || metaMatches.firstMarkdownImage?.[1] || "";
    } catch (e) {
      console.error("Error extracting OG image:", e);
    }

    const screenshotFallback = `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=1200&h=800`;

    // 2. Generate with OpenAI
    const systemPrompt = `Sos un director de producto, editor y diseñador visual especializado en transformar sitios en boards premium para huevsite.io.

OBJETIVO:
Convertir un sitio en un sub-site minimalista, descriptivo y visualmente atractivo.
La prioridad, en este orden, es:
1. Claridad de producto
2. Branding
3. Impacto visual

AUDIENCIA:
Builders, founders, inversores y clientes potenciales.

ESTILO:
- Español neutro
- Sobrio y premium
- Minimalista, con edge y personalidad
- Titulares cortos de alto impacto
- Descripciones de una sola línea, con máxima precisión

PROHIBIDO:
- Hype
- Claims inventados
- Emojis
- Frases marketineras vacías
- Jerga inflada tipo "revoluciona", "game changer", "next-gen", "innovador" sin sustancia

ESTRUCTURA:
Debes generar EXACTAMENTE 8 bloques para un grid 4x3:
1. HERO (2x2)
2. PROJECT (2x1)
3. MEDIA (1x1)
4. METRIC (1x1)
5. METRIC (1x1)
6. BUILDING (1x1)
7. CUSTOM (1x1)
8. CUSTOM (1x1)

JERARQUÍA VISUAL:
- HERO: identidad + propuesta de valor más clara posible.
- PROJECT: la pieza visual principal del producto.
- METRICS: prueba concreta o señal objetiva.
- BUILDING: stack, arquitectura o cómo está construido.
- CUSTOM: diferenciador real, CTA sobrio o social proof.

REGLAS DE ESCRITURA:
1. Extraé la verdad central del producto. Si no está clara, simplificala.
2. El title de cada bloque debe ser corto, limpio y escaneable.
3. La description debe ser una sola línea. Sin párrafos.
4. No inventes números, usuarios, revenue, tracción ni logos.
5. Si no hay métricas reales, usá métricas de performance, velocidad, cobertura o resultado solo si están explícitas o pueden inferirse de forma defensible del contenido.
6. Si una inferencia no es sólida, no la uses.
7. Evitá repetir la misma idea en varios bloques.
8. Cada bloque debe aportar una capa distinta: qué es, qué muestra, qué valida, cómo está hecho, por qué importa.
9. Menos palabras es mejor. Precisión antes que adorno.
10. El resultado debe sentirse editorial, tecnológico y premium.

REGLAS POR BLOQUE:
- HERO:
  - title: nombre del producto o marca
  - description: una línea con fórmula "[qué es] + [para quién o para qué] + [resultado]"
- PROJECT:
  - mostrar el núcleo visual del producto
  - title corto
  - description: qué hace esa pieza visual o demo
- MEDIA:
  - usar la imagen más fuerte disponible
  - title y description discretos, nunca protagonistas
- METRIC:
  - label en mayúsculas, una palabra
  - value corto y visual
  - solo datos reales o inferencias muy conservadoras
- BUILDING:
  - mostrar stack, sistema o capacidad técnica real
  - priorizar tecnologías conocidas y concretas
- CUSTOM:
  - uno debe funcionar como diferenciador o social proof si existe
  - el otro puede funcionar como CTA sobrio o conclusión de producto

REGLAS VISUALES:
- Debe sentirse aireado, no cargado
- Debe favorecer bloques con pocas palabras
- Debe parecer diseñado, no escrito por marketing
- Referencia estética: premium, precisa, con personalidad técnica

Respondé SIEMPRE con JSON válido según el schema.`;

    const userPrompt = `Analizá este sitio y convertí su esencia en un board premium de huevsite.io.

REFERENCIAS DE CALIDAD:
- huevsite.io/huevsite
- huevsite.io/galfrevn

CONTEXTO:
- URL: ${url}
- OG Image detectada: ${ogImageUrl || "No detectada"}
- Screenshot fallback: ${screenshotFallback}

ESTRUCTURA OBLIGATORIA Y ORDEN EXACTO:
1. Hero (2x2)
2. Project (2x1)
3. Media (1x1) - Usar ${ogImageUrl || screenshotFallback}
4. Metric (1x1)
5. Metric (1x1)
6. Building (1x1)
7. Custom (1x1)
8. Custom (1x1)

CRITERIO EDITORIAL:
- Primero entendé el producto.
- Después condensalo.
- Después diseñá el relato visual.
- El output debe leerse en segundos.
- Cada bloque debe poder sostenerse por sí solo.
- Si una idea no suma claridad o valor percibido, no entra.

CHECKLIST ANTES DE RESPONDER:
- ¿El HERO explica el producto con claridad inmediata?
- ¿El PROJECT muestra algo visualmente atractivo del producto?
- ¿Las métricas son reales o extremadamente conservadoras?
- ¿El BUILDING dice algo técnico concreto?
- ¿Los CUSTOM agregan diferenciación, prueba o cierre útil?
- ¿Todo suena sobrio, preciso y premium?
- ¿Hay pocas palabras y alta densidad de señal?

CONTENIDO DEL SITIO:
${truncatedContent.substring(0, 10000)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "subsite_content",
          strict: true,
          schema: subSiteJsonSchema,
        },
      },
    });

    const aiData = JSON.parse(completion.choices[0]?.message?.content || "{}");

    // Process Favicon
    let faviconUrl = "";
    try {
      const parsedUrl = new URL(url);
      const resolvedFavicon = await resolveFaviconUrl(url);

      if (resolvedFavicon) {
        faviconUrl = resolvedFavicon.sourceUrl;

        const extension = resolvedFavicon.contentType.split("/")[1]?.split(";")[0] || "png";
        const slugForPath = (aiData.slug || parsedUrl.hostname).replace(/[^a-z0-9-]/g, "-");
        const storagePath = `${user.id}/subsites/${slugForPath}-favicon.${extension}`;

        const { error: uploadError } = await supabase.storage.from("assets").upload(storagePath, resolvedFavicon.bytes, {
          contentType: resolvedFavicon.contentType,
          upsert: true
        });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(storagePath);
          faviconUrl = publicUrl;
        } else {
          console.warn("Favicon upload error:", uploadError);
        }
      }
    } catch (e) {
      console.error("Favicon error:", e);
    }

    // 3. Save Sub-site
    let baseSlug = aiData.slug || aiData.title.toLowerCase().replace(/[^a-z0-9-]/g, "");
    let finalSlug = baseSlug;
    let isUnique = false;
    let counter = 1;

    while (!isUnique) {
      const { data: existingSite } = await supabase.from('sub_sites').select('id').eq('user_id', user.id).eq('slug', finalSlug).maybeSingle();
      if (!existingSite) { isUnique = true; } else { finalSlug = `${baseSlug}-${counter}`; counter++; }
    }

    // Insert sub-site with robust fallback for missing columns
    const fullPayload = {
      user_id: user.id,
      title: aiData.title,
      slug: finalSlug,
      description: aiData.tagline || "",
      source_url: url,
      avatar_url: faviconUrl
    };

    let { data: newSubSite, error: subSiteError } = await supabase
      .from('sub_sites')
      .insert(fullPayload)
      .select()
      .single();

    // If PGRST204 or missing column error, retry with minimal columns
    if (subSiteError && (subSiteError.code === 'PGRST204' || subSiteError.message?.includes('column'))) {
      console.warn("Retrying sub-site insert without optional columns due to DB cache error");
      const minimalPayload = {
        user_id: user.id,
        title: aiData.title,
        slug: finalSlug,
        description: aiData.tagline || "",
      };
      
      const { data: retryData, error: retryError } = await supabase
        .from('sub_sites')
        .insert(minimalPayload)
        .select()
        .single();
        
      if (retryError) throw retryError;
      newSubSite = retryData;

    } else if (subSiteError) {
      throw subSiteError;
    }

    if (newSubSite?.id) {
      const updatePayload: Record<string, string> = { source_url: url };
      if (faviconUrl) {
        updatePayload.avatar_url = faviconUrl;
      }

      const { data: updatedSubSite, error: avatarUpdateError } = await supabase
        .from('sub_sites')
        .update(updatePayload)
        .eq('id', newSubSite.id)
        .select()
        .single();

      if (!avatarUpdateError && updatedSubSite) {
        newSubSite = updatedSubSite;
      } else if (avatarUpdateError) {
        console.warn("Could not persist sub-site avatar after insert", avatarUpdateError);
      }
    }

    // 4. Save Blocks
    const dbBlocks = aiData.blocks.map((b: any, index: number) => {
      let colSpan = 1; let rowSpan = 1;
      if (b.type === "hero") { colSpan = 2; rowSpan = 2; }
      else if (b.type === "project") { colSpan = 2; rowSpan = 1; }

      let blockData: any = {};
      if (b.type === "hero") {
        blockData = { name: b.title, tagline: b.description, status: "Live", location: "Internet", avatarUrl: faviconUrl };
      } else if (b.type === "metric") {
        blockData = { label: b.label || "STAT", value: b.value || "0", title: b.title, description: b.description };
      } else if (b.type === "project") {
        blockData = { title: b.title, description: b.description, link: b.link || url, imageUrl: b.imageUrl || ogImageUrl || screenshotFallback, stack: [] };
      } else if (b.type === "media") {
        blockData = { url: b.imageUrl || ogImageUrl || screenshotFallback, title: b.title, description: b.description };
      } else if (b.type === "building") {
        blockData = { project: b.title, description: b.description, stack: b.stack || [], link: b.link || "" };
      } else {
        blockData = { label: b.label || "INFO", title: b.title, description: b.description, link: b.link || "" };
      }

      return {
        user_id: user.id,
        sub_site_id: newSubSite.id,
        type: b.type === "media" ? "media" : (b.type === "hero" ? "hero" : (b.type === "metric" ? "metric" : (b.type === "project" ? "project" : (b.type === "building" ? "building" : "custom")))),
        order: index,
        col_span: colSpan,
        row_span: rowSpan,
        visible: true,
        data: blockData
      };
    });

    await supabase.from('blocks').insert(dbBlocks);

    // 5. Recompute Score
    try { await scoreService.recomputeScore(user.id); } catch(e) { console.error("Score recompute error:", e); }

    return NextResponse.json({ success: true, subSite: newSubSite });

  } catch (error: any) {
    console.error("Generate subsite error:", error);
    return NextResponse.json({ error: "Falló la magia de la IA.", details: error.message }, { status: 500 });
  }
}
