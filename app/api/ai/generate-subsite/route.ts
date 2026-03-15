import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { scoreService } from "@/lib/score-service";

export const maxDuration = 60; // Set max duration to 60s for Vercel
export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Check if user is PRO
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, pro_since")
      .eq("id", user.id)
      .single();

    if (profile?.subscription_tier !== "pro" && !profile?.pro_since) {
      return NextResponse.json({ error: "Esta función es exclusiva para usuarios PRO." }, { status: 403 });
    }

    const { url } = await request.json();

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
    const systemPrompt = `Sos un Senior Product Marketer y Designer.
Tu misión: Transformar un sitio web en un Board de huevsite.io (Bento Box style) visualmente impactante, uniforme y extremadamente vendedor.

FILOSOFÍA: "Punk Marketing". Directo, sin rellenos corporativos, usando el "voseo" rioplatense (argentino) de forma sutil. 🚀
ESTRUCTURA: Generarás EXACTAMENTE 8 BLOQUES para un grid de 4x3 (12 celdas).

DISTRIBUCIÓN DEL GRID (Total 12 celdas):
- 1x HERO (2x2) = 4 celdas. "Pitch demoledor".
- 1x PROJECT (2x1) = 2 celdas. "Wow factor visual".
- 1x MEDIA (1x1) = 1 celda. "Social proof visual (OG Image)".
- 2x METRIC (1x1 each) = 2 celdas. "Data-driven trust".
- 1x BUILDING (1x1) = 1 celda. "Under the hood / Stack".
- 1x CUSTOM (1x1) = 1 celda. "USP (Unique Selling Proposition)".
- 1x CUSTOM (1x1) = 1 celda. "CTA / Final impact".

REGLAS:
1. No inventes números. Usá métricas de velocidad/fricción si no hay stats reales.
2. HERO: El tagline debe ser una bofetada de claridad. "[Qué es] + [Propósito] + [Resultado]".
3. IMÁGENES: Prioridad absoluta a la OG Image detectada.

Respondés SIEMPRE con JSON válido según el schema.`;

    const userPrompt = `Analizá este producto/sitio y creá un board de 12 celdas (4x3):
URL: ${url}
OG Image detectada: ${ogImageUrl}
Screenshot fallback: ${screenshotFallback}

ESTRUCTURA REQUERIDA (8 bloques en orden exacto):
1. Hero (2x2)
2. Project (2x1)
3. Media (1x1) - Usar ${ogImageUrl || screenshotFallback}
4. Metric (1x1)
5. Metric (1x1)
6. Building (1x1)
7. Custom (1x1)
8. Custom (1x1)

═══════════════════════════════════════
CONTENIDO DEL SITIO:
═══════════════════════════════════════
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
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=128`;
      const faviconRes = await fetch(googleFaviconUrl);
      if (faviconRes.ok) {
        const faviconBuffer = await faviconRes.arrayBuffer();
        const contentType = faviconRes.headers.get("content-type") || "image/png";
        const slugForPath = (aiData.slug || parsedUrl.hostname).replace(/[^a-z0-9-]/g, "-");
        const storagePath = `${user.id}/subsites/${slugForPath}-favicon.png`;

        await supabase.storage.from("assets").upload(storagePath, faviconBuffer, { contentType, upsert: true });
        const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(storagePath);
        faviconUrl = publicUrl;
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
