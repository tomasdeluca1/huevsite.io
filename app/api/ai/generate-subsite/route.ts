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
Huevsite no es un currículum aburrido. Es una grilla estilo bento, dinámica y accionable. Menos texto, más impacto.

1. hero: Portada obligatoria (order: 0). 'title'=Nombre producto, 'description'=Tagline brutal de 2 líneas máx.
2. metric: KPIs clave. 'label'=MAYÚSCULAS breve (ej. "USERS"), 'value'=Número impactante (ej. "40k+"). No texto largo.
3. custom: Features principales. 'label'=MAYÚSCULAS, 'title'=Gancho, 'description'=Directo al punto.
4. building: Stack o Roadmap. 'title'="Tech Stack", 'description'=Info, 'stack'=[tecnologías].
5. project: Acción visual. 'title'=Nombre, 'description'=Logro, 'imageUrl'=URL ABSOLUTA extraída del MD originial ![alt](url), 'link'=Demo.

COMPOSICIÓN GANADORA (Max 6 bloques):
1. hero (col_span: 2, row_span: 2)
2. project (CRÍTICO extraer imageUrl de Jina)
3. metric (x2)
4. custom (Feature estrella)
5. building (Stack)
Ningún bloque debe sobrepasar los 150 caracteres de descripción.
    `;

    const prompt = `
    sos un experto diseñador y copywriter de landing pages para portfolios de creadores (indie hackers, developers, designers).
    Tu tarea es analizar el siguiente texto extraído de una URL y estructurar una "sub-site" (página de producto) para huevsite.io.
    
    SIGUE ESTAS REGLAS ESTRICTAMENTE:
    """
    ${AI_BLOCK_GUIDELINES}
    """
    
    El texto extraído de la web es el siguiente:
    """
    ${truncatedContent}
    """
    
    Instrucciones adicionales:
    - Escribid en español rioplatense (argentino) pero muy sutil y super profesional, "hacker vibes".
    - El título de la sub-site ('title') debe ser el nombre exacto del producto, marca o empresa extraído de la web (Ej: "Huevsite Studio" si es una agencia).
    - Identifica si el contenido pertenece a una Startup, un SaaS, un Proyecto open-source, o una Agencia Web. Adapta el tono, los bloques y el hero ('description') para reflejar su identidad real. Si es una Agencia, destaca sus servicios, filosofía y trabajos en los bloques.
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
    const { data: newSubSite, error: subSiteError } = await supabase
        .from('sub_sites')
        .insert({
            user_id: user.id,
            title: aiData.title,
            slug: finalSlug,
            avatar_url: faviconUrl,
        })
        .select()
        .single();
        
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
