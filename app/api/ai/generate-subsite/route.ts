import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

export const maxDuration = 60; // Set max duration to 60s for Vercel
export const dynamic = "force-dynamic";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const subSiteSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A short, catchy title for the sub-site (e.g., the product name).",
    },
    slug: {
      type: Type.STRING,
      description: "A URL-friendly slug based on the title (lowercase, hyphens only).",
    },
    blocks: {
      type: Type.ARRAY,
      description: "An array of blocks that make up the sub-site content.",
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description: "The type of block. Allowed values: 'hero', 'metric', 'custom', 'building', 'writing', 'project'.",
          },
          label: {
            type: Type.STRING,
            description: "A small uppercase label for the block (e.g., 'FEATURES', 'STATS', 'ROADMAP'). Used mostly for 'custom' or 'metric' blocks.",
          },
          title: {
            type: Type.STRING,
            description: "The main heading of the block.",
          },
          description: {
            type: Type.STRING,
            description: "A short description or body text for the block.",
          },
          value: {
            type: Type.STRING,
            description: "The main numeric or text value if the block type is 'metric' (e.g., '10k', '$5k MRR').",
          },
          link: {
            type: Type.STRING,
            description: "An optional URL if the block should link somewhere.",
          },
          imageUrl: {
            type: Type.STRING,
            description: "CRITICAL: If the block type is 'project' and the source text contains markdown images like `![alt](url)`, extract the absolute URL and put it here.",
          },
          stack: {
             type: Type.ARRAY,
             description: "An optional list of technologies if the block type is 'building'.",
             items: { type: Type.STRING }
          }
        },
        required: ["type", "title", "description"],
      },
    },
  },
  required: ["title", "slug", "blocks"],
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
      return NextResponse.json({ error: "Esta función es exclusiva para usuarios PRO." }, { status: 403 });
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
    
    // Safety truncate if page is huge to avoid token limits (taking first 15k chars is usually enough for a landing page)
    const truncatedContent = pageContent.slice(0, 15000); 

    // 2. Generate with Gemini
    console.log("Generating blocks with Gemini...");
    
    // Import guidelines for better parsing
    const AI_BLOCK_GUIDELINES = `
Huevsite es una grilla estilo bento box, vibrante y accionable (estilo hacker "build in public").
Escribe textos ultra-cortos y contundentes ("menos es más"). Utiliza emojis inteligentemente para darle vida.

TIPOS DE BLOQUES DISPONIBLES:
1. hero: (Obligatorio, order: 0, col_span: 2, row_span: 2). Portada principal. 'title'=Nombre producto, 'description'=Tagline brutal (max. 80 chars).
2. project: Muestra visual de un producto o feature. 'title'=Nombre, 'description'=Logro/Info (max. 60 chars).
   -> CRÍTICO PARA PROJECT: 'imageUrl' DEBE ser la URL absoluta de una imagen del contenido (busca markdown ![alt](url)). Si NO encuentras una imagen válida en el texto, usa OBLIGATORIAMENTE este fallback para generar una captura: "https://image.thum.io/get/width/1200/crop/800/${url}"
3. metric: KPIs, descargas o hitos. 'label'=MAYÚSCULAS breve (ej. "USERS", "MRR"). 'value'=Número ("40k+", "$5k"). 'title'/'description' cortísimos.
4. custom: Ventaja única o update. 'label'=MAYÚSCULAS, 'title'=Gancho corto, 'description'=Directo al grano.
5. building: Stack tecnológico o status "En construcción". 'title'="Tech Stack", 'stack'=[array de 3-4 techs].

COMPOSICIÓN GANADORA (Genera exactamente 5 o 6 bloques, ni más ni menos):
- 1x hero (col_span: 2) -> Fija la identidad.
- 1x project (col_span: 2) -> Aporta atractivo visual MASIVO (nunca olvides la imageUrl).
- 2x metric -> Demuestra autoridad de un vistazo.
- 1x building o custom -> Completa la grilla con contexto técnico o propuesta de valor.

REGLA DE OPTIMIZACIÓN DE TOKENS: Sintetiza TODO al extremo. Ninguna 'description' debe superar los 100 caracteres. Las descripciones largas arruinarán el diseño de la grilla. Absté de inventar información técnica falsa; si no hay datos técnicos, enfócate en la visión del proyecto.
    `;

    const prompt = `
    sos un experto diseñador y copywriter de landing pages para portfolios de creadores (indie hackers, developers, designers).
    Tu tarea es analizar el siguiente texto extraído de la web (${url}) y estructurar la información en "bloques" para huevsite.io.
    
    REGLA ESTRICTA DE FORMATO:
    """
    ${AI_BLOCK_GUIDELINES}
    """
    
    El texto parseado de la URL es:
    """
    ${truncatedContent}
    """
    
    Instrucciones adicionales de Tono:
    - Escribid en español rioplatense (argentino) muy sutil, con un feeling altamente profesional y tecnológico ("hacker vibes").
    - Adapta la narrativa según el target que percibas: si es un SaaS, enfócate en el problema que resuelve; si es Open Source, en la comunidad y el stack.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: subSiteSchema as any,
        }
    });

    const aiResultText = response.text;
    if (!aiResultText) {
        throw new Error("Empty response from AI");
    }

    const aiData = JSON.parse(aiResultText);
    
    // Extract favicon from URL
    let faviconUrl = "";
    try {
        const parsedUrl = new URL(url);
        faviconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=128`;
    } catch (e) {
        console.error("Error parsing URL for favicon:", e);
    }

    // 3. Save to Database
    console.log("Saving sub-site to DB:", aiData.title);
    
    let baseSlug = aiData.slug || aiData.title.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!baseSlug) baseSlug = "sub-site";
    
    let finalSlug = baseSlug;
    let isUnique = false;
    let counter = 1;

    // Check slug uniqueness for the user
    while (!isUnique) {
        const { data: existingSite } = await supabase
            .from('sub_sites')
            .select('id')
            .eq('user_id', user.id)
            .eq('slug', finalSlug)
            .single();
            
        if (!existingSite) {
            isUnique = true;
        } else {
            finalSlug = `${baseSlug}-${counter}`;
            counter++;
        }
    }
    
    // Insert sub-site
    const insertData: any = {
        user_id: user.id,
        title: aiData.title,
        slug: finalSlug,
    };
    
    // Primera tentativa: con avatar_url
    let payload = { ...insertData };
    if (faviconUrl) payload.avatar_url = faviconUrl;

    let { data: newSubSite, error: subSiteError } = await supabase
        .from('sub_sites')
        .insert(payload)
        .select()
        .single();
        
    // Fallback si la columna no existe en el schema cache (PGRST204)
    if (subSiteError && (subSiteError as any).code === 'PGRST204') {
        const { data: secondAttempt, error: secondError } = await supabase
            .from('sub_sites')
            .insert(insertData)
            .select()
            .single();
        
        newSubSite = secondAttempt;
        subSiteError = secondError;
    }
        
    if (subSiteError) {
        console.error("Error creating subsite:", subSiteError);
        return NextResponse.json({ error: "No se pudo crear el sub-site." }, { status: 500 });
    }


    // Format blocks for DB
    const dbBlocks = aiData.blocks.map((b: any, index: number) => {
        const colSpan = b.type === "hero" ? 2 : (b.type === "custom" || b.type === "building" ? 2 : 1);
        const rowSpan = b.type === "hero" ? 2 : (b.type === "custom" ? 1 : 1);
        
        let blockData: any = {};
        
        if (b.type === "hero") {
            blockData = { name: b.title, tagline: b.description, description: "", status: "Live", location: "Internet", avatarUrl: faviconUrl };
        } else if (b.type === "metric") {
            blockData = { label: b.label || b.title || "STAT", value: b.value || "0" };
        } else if (b.type === "custom") {
            blockData = { label: b.label || "INFO", title: b.title, description: b.description, link: b.link || "" };
        } else if (b.type === "building") {
            blockData = { project: b.title, description: b.description, stack: b.stack || [], link: b.link || "" };
        } else if (b.type === "project") {
            blockData = { title: b.title, description: b.description, link: b.link || "", stack: [], imageUrl: b.imageUrl || "", metrics: "" };
        } else {
            blockData = { title: b.title, description: b.description }; // fallback
        }

        return {
            user_id: user.id,
            sub_site_id: newSubSite.id,
            type: b.type === "project" && !["hero", "metric", "custom", "building"].includes(b.type) ? "project" : b.type,
            order: index,
            col_span: colSpan,
            row_span: rowSpan,
            visible: true,
            data: blockData
        };
    });

    // We only insert recognized types to prevent DB errors
    const validTypes = ["hero", "building", "github", "project", "stack", "metric", "social", "community", "writing", "cv", "media", "certification", "achievement", "collab", "custom"];
    const validDbBlocks = dbBlocks.filter((b: any) => validTypes.includes(b.type));

    if (validDbBlocks.length > 0) {
        const { error: blocksError } = await supabase
            .from('blocks')
            .insert(validDbBlocks);
            
        if (blocksError) {
            console.error("Error inserting blocks:", blocksError);
            // We return the subsite anyway, it'll just be empty
        }
    }

    return NextResponse.json({ 
        success: true, 
        subSite: newSubSite 
    });

  } catch (error: any) {
    console.error("Generate subsite error:", error);
    return NextResponse.json(
      { error: "Falló la magia de la IA.", details: error.message },
      { status: 500 }
    );
  }
}
