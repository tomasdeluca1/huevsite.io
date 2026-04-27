const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface InterviewData {
  builderName: string;
  builderUsername: string;
  introWhoAreYou: string;
  introOriginStory: string;
  introBuildInPublic: string;
  projectsMainProject: string;
  projectsProblemSolved: string;
  projectsStack: string;
  projectsBiggestChallenge: string;
  projectsUsersTraction: string;
  projectsLinks: string;
  quickfireTool: string;
  quickfireInspiration: string;
  quickfireAdvice: string;
  quickfireWhatsNext: string;
  quickfireWhereToFind: string;
  // Other builders that won the same week. When present, the per-builder
  // posts (blog/twitter/linkedin) cross-reference them. The carousel prompt
  // produced here is SOLO — when there are co-winners, the API route
  // overrides it with `generateJointCarouselPrompt` once all forms arrive.
  coWinners?: Array<{ name: string; username: string }>;
  weekLabel?: string;
}

// Subset of InterviewData carried per-builder for the joint carousel prompt.
export interface JointCarouselBuilder {
  name: string;
  username: string;
  introWhoAreYou: string;
  projectsMainProject: string;
  projectsProblemSolved: string;
  projectsStack: string;
}

interface GeneratedContent {
  blogMarkdown: string;
  blogTitle: string;
  blogExcerpt: string;
  blogTags: string[];
  linkedinPost: string;
  twitterPost: string;
  instagramCaption: string;
  // Natural-language briefs designed to be pasted into Creatibro
  // (creatibro.com) — a 1-2 sentence brief is what the tool expects;
  // it picks slide layout, copy, and hashtags using Voice DNA.
  instagramCarouselPrompt: string;
  instagramStoryPrompt: string;
}

const SYSTEM_PROMPT = `Sos un redactor de contenido para huevsite.io, una plataforma de builders que construyen productos en público.

Tu tarea es procesar las respuestas de una entrevista escrita al "Builder de la Semana" y generar 6 piezas de contenido.

REGLAS GENERALES:
- Todo en español argentino (usá "vos", no "tú")
- Tono: cercano, directo, como contarle a un amigo sobre alguien interesante que conociste
- Usá quotes textuales del builder (entre comillas) para darle autenticidad
- No seas corporativo. Sé real.
- El blog post debe usar Markdown

FORMATO DE RESPUESTA (JSON estricto):
{
  "blogTitle": "Título atrapante del blog post (máx 80 chars)",
  "blogExcerpt": "2-3 líneas que resuman la historia y den ganas de leer (máx 200 chars)",
  "blogTags": ["entrevista", "builder-de-la-semana", "comunidad", ...tags relevantes del stack o tema],
  "blogMarkdown": "Post completo en Markdown con esta estructura:\\n> Quote potente del builder\\n\\n## Quién es [nombre]\\n(2-3 párrafos)\\n\\n## Lo que está construyendo\\n(3-4 párrafos sobre proyecto, problema, solución, stack)\\n\\n## El momento clave\\n(1-2 párrafos sobre el desafío más grande)\\n\\n## Para la comunidad\\n(1-2 párrafos con consejos y visión)\\n\\n## Dónde encontrarlo\\n- huevsite: huevsite.io/username\\n- links del builder\\n\\n---\\n*Esta entrevista es parte de la serie Builder de la Semana de huevsite.io.*",
  "linkedinPost": "Post para LinkedIn (máx 1300 chars). Hook fuerte, 2-3 párrafos cortos, quote, CTA al blog. Hashtags: #buildinpublic #huevsite",
  "twitterPost": "Tweet único (máx 270 chars). Nombre, quote corta, qué construye, link al blog. #buildinpublic #huevsite",
  "instagramCaption": "Caption para IG (máx 2200 chars). Storytelling con saltos de línea, emojis moderados, hashtags al final",
  "instagramCarouselPrompt": "Brief de 1-3 oraciones para Creatibro que produzca un carrusel de 7 slides sobre este builder. Ver REGLAS PROMPT CREATIBRO abajo.",
  "instagramStoryPrompt": "Brief de 1-2 oraciones para Creatibro que produzca UNA story de IG (1 slide) reflejando el perfil individual de este builder. Ver REGLAS PROMPT CREATIBRO abajo."
}

REGLAS PROMPT CREATIBRO (instagramCarouselPrompt + instagramStoryPrompt):
- Creatibro toma briefs cortos en lenguaje natural y arma el visual él solo (no le mandes JSON ni listas de slides).
- Estructura recomendada: "[Mensaje central en 1 oración]. Para [audiencia: builders/founders early-stage en LATAM]. Quiero que sientan [emoción] y [CTA: visiten el perfil / lean el blog / lo sigan]. Tono: [directo, informal argentino, build-in-public]. [Detalle puntual: nombre, proyecto, quote, stack]."
- Carrusel: pedí explícitamente "7 slides" en el brief y mencioná cover + cuerpo + CTA final.
- Story: pedí "1 slide vertical 9:16, copy ultra corto (max 8 palabras visibles)".
- NO incluyas hashtags dentro del prompt (Creatibro los agrega).
- Largo objetivo: carousel 4-6 oraciones, story 2-3 oraciones.

CARROUSEL — qué información incluir en el brief:
- Nombre y @handle del builder
- 1 línea de quién es (ciudad/role)
- Nombre del proyecto + qué problema resuelve
- 1 quote textual potente del builder (entre comillas)
- CTA: "conocelo en huevsite.io/[username]"

STORY — qué información incluir en el brief:
- Nombre del builder + foto/avatar
- 1 hook ("Builder de la Semana en huevsite.io")
- CTA: link al perfil`;

const JOINT_CAROUSEL_SYSTEM_PROMPT = `Sos un redactor de contenido para huevsite.io.

Tu tarea: armar UN solo prompt en lenguaje natural para Creatibro (creatibro.com) que produzca un carrusel de Instagram de 7 slides presentando a VARIOS builders que ganaron Builder de la Semana en la misma semana (empate).

REGLAS:
- Español argentino (usá "vos")
- Tono: directo, informal, build-in-public
- Devolvé SOLO el prompt como string JSON: { "prompt": "..." }
- El prompt debe ser de 5-8 oraciones, sin JSON ni listas de slides adentro
- Mencioná a cada builder por nombre y @handle, qué construye cada uno (1 línea), y un punto en común que justifique el empate
- CTA final: "conocelos en huevsite.io"
- NO incluyas hashtags dentro del prompt (Creatibro los agrega)
- Estructura sugerida: hook → presentación de cada builder → qué los une → CTA

FORMATO DE RESPUESTA (JSON estricto):
{ "prompt": "..." }`;

function formatInterviewForAI(data: InterviewData): string {
  const hasCoWinners = (data.coWinners || []).length > 0;
  const coWinnersBlock = hasCoWinners
    ? `\n--- CO-GANADORES DE LA MISMA SEMANA ---\nEsta semana${data.weekLabel ? ` (${data.weekLabel})` : ""} hubo empate. Además de ${data.builderName}, también ganaron:\n${data.coWinners!
        .map((c) => `- ${c.name} (@${c.username}) — https://huevsite.io/${c.username}`)
        .join("\n")}

INSTRUCCIÓN IMPORTANTE: Este blog post + tweet + LinkedIn + caption son SOBRE ${data.builderName} (post individual). En el blog, antes del footer, agregá una nota corta "Esta semana también ganaron:" listando a los co-ganadores con link al perfil. En tweet y LinkedIn mencioná a los co-ganadores con "@" + handle. En la caption sumá una línea final mencionándolos. Para los prompts de Creatibro (carrusel + story): el carrusel acá lo generás SOLO sobre ${data.builderName} — el sistema lo va a sobrescribir con un carrusel JOINT cuando todos los co-ganadores hayan completado el form. La story SIEMPRE es individual sobre ${data.builderName}.`
    : "";

  return `ENTREVISTA — Builder de la Semana

Builder: ${data.builderName} (@${data.builderUsername})
Perfil: https://huevsite.io/${data.builderUsername}
${coWinnersBlock}

--- INTRO ---
¿Quién sos?
${data.introWhoAreYou}

¿Cómo arrancaste a buildear?
${data.introOriginStory}

¿Qué significa build in public para vos?
${data.introBuildInPublic}

--- PROYECTOS ---
¿En qué proyecto estás laburando?
${data.projectsMainProject}

¿Qué problema resuelve?
${data.projectsProblemSolved}

¿Qué stack usás?
${data.projectsStack}

¿Cuál fue el momento más difícil?
${data.projectsBiggestChallenge}

¿Tenés usuarios reales?
${data.projectsUsersTraction}

Links de tus proyectos:
${data.projectsLinks}

--- RÁPIDAS ---
Herramienta que no podrías dejar de usar: ${data.quickfireTool}
Builder/creador que te inspire: ${data.quickfireInspiration}
Un consejo para builders: ${data.quickfireAdvice}
¿Qué viene después?: ${data.quickfireWhatsNext}
¿Dónde te encuentran?: ${data.quickfireWhereToFind}`;
}

function formatJointBuildersForAI(
  builders: JointCarouselBuilder[],
  weekLabel?: string
): string {
  return `Co-ganadores Builder de la Semana${weekLabel ? ` (${weekLabel})` : ""}:

${builders
  .map(
    (b, i) => `BUILDER ${i + 1}
Nombre: ${b.name}
Handle: @${b.username}
Perfil: https://huevsite.io/${b.username}
Quién es: ${b.introWhoAreYou}
Proyecto principal: ${b.projectsMainProject}
Problema que resuelve: ${b.projectsProblemSolved}
Stack: ${b.projectsStack}`
  )
  .join("\n\n")}`;
}

async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://huevsite.io",
      "X-Title": "huevsite.io",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content in OpenRouter response");
  return content;
}

export async function generateInterviewContent(
  data: InterviewData
): Promise<GeneratedContent> {
  const content = await callOpenRouter(SYSTEM_PROMPT, formatInterviewForAI(data));
  return JSON.parse(content) as GeneratedContent;
}

// Generate ONE Creatibro prompt presenting all co-winners of the same week.
// The result replaces `generated_instagram_carousel_prompt` on every
// co-winner's interview row once the last form is submitted.
export async function generateJointCarouselPrompt(
  builders: JointCarouselBuilder[],
  weekLabel?: string
): Promise<string> {
  const content = await callOpenRouter(
    JOINT_CAROUSEL_SYSTEM_PROMPT,
    formatJointBuildersForAI(builders, weekLabel)
  );
  const parsed = JSON.parse(content) as { prompt?: string };
  if (!parsed.prompt || typeof parsed.prompt !== "string") {
    throw new Error("Joint carousel response missing 'prompt' field");
  }
  return parsed.prompt;
}
