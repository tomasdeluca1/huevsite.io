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
  // Other builders that won the same week. When present, the generated
  // content mentions them (with @handle + profile link) so each post in a
  // multi-winner week cross-references its siblings.
  coWinners?: Array<{ name: string; username: string }>;
  weekLabel?: string;
}

export interface CarouselSlide {
  heading: string;
  body: string;
  footer?: string;
}

interface GeneratedContent {
  blogMarkdown: string;
  blogTitle: string;
  blogExcerpt: string;
  blogTags: string[];
  linkedinPost: string;
  twitterPost: string;
  instagramCaption: string;
  instagramCarousel: CarouselSlide[];
}

const SYSTEM_PROMPT = `Sos un redactor de contenido para huevsite.io, una plataforma de builders que construyen productos en público.

Tu tarea es procesar las respuestas de una entrevista escrita al "Builder de la Semana" y generar 5 piezas de contenido.

REGLAS:
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
  "instagramCarousel": [
    {
      "heading": "SLIDE 1 — COVER. Nombre del builder en grande. Subtítulo: Builder de la Semana. Frase corta de enganche.",
      "body": "Texto principal del slide",
      "footer": "Texto chico al pie (opcional)"
    },
    {
      "heading": "SLIDE 2 — QUIÉN ES. Nombre + una línea de contexto (de dónde es, qué hace).",
      "body": "2-3 oraciones sobre su background y cómo arrancó a buildear. Directo, sin relleno."
    },
    {
      "heading": "SLIDE 3 — QUÉ CONSTRUYE. Nombre del proyecto principal.",
      "body": "2-3 oraciones: qué problema resuelve, para quién, qué stack usa. Que se entienda sin ser dev."
    },
    {
      "heading": "SLIDE 4 — QUOTE. La frase más potente del builder entre comillas.",
      "body": "Solo la quote. Nada más. Que pegue."
    },
    {
      "heading": "SLIDE 5 — EL DESAFÍO. Momento más difícil o aprendizaje clave.",
      "body": "2-3 oraciones sobre qué le costó y qué aprendió. Lo que humaniza la historia."
    },
    {
      "heading": "SLIDE 6 — CONSEJO. Un tip directo para otros builders.",
      "body": "El mejor consejo que dio en la entrevista. Corto y memorable."
    },
    {
      "heading": "SLIDE 7 — CTA. Conocé a @username en huevsite.io.",
      "body": "Link al perfil + redes. Footer: 'Leé la entrevista completa en huevsite.io/blog'",
      "footer": "huevsite.io"
    }
  ]
}

REGLAS PARA EL CARRUSEL:
- 7 slides exactos
- Cada slide tiene heading (título grande), body (texto principal), footer (opcional, pie de slide)
- Estética: dark (#0a0a0a), acento verde lima (#C8FF00), tipografía bold sans-serif
- Heading: máximo 8 palabras. Body: máximo 40 palabras por slide. Footer: máximo 5 palabras
- Slide 1 es la tapa, slide 7 es el CTA. Los del medio cuentan la historia
- Tono: directo, informal argentino, como un reel contando una historia
- La quote del slide 4 debe ser textual de las respuestas del builder`;

function formatInterviewForAI(data: InterviewData): string {
  const hasCoWinners = (data.coWinners || []).length > 0;
  const coWinnersBlock = hasCoWinners
    ? `\n--- CO-GANADORES DE LA MISMA SEMANA ---\nEsta semana${data.weekLabel ? ` (${data.weekLabel})` : ""} hubo empate. Además de ${data.builderName}, también ganaron:\n${data.coWinners!
        .map((c) => `- ${c.name} (@${c.username}) — https://huevsite.io/${c.username}`)
        .join("\n")}

INSTRUCCIÓN IMPORTANTE: Este post es SOBRE ${data.builderName}, pero al final del blog (sección "Dónde encontrarlo" o antes del footer) agregá una nota corta que diga "Esta semana también ganaron:" y listá a los co-ganadores con link al perfil (huevsite.io/username). En el tweet y LinkedIn mencioná a los co-ganadores con "@" y sus handles. En la caption de Instagram sumá una línea al final mencionándolos. El carrusel no los menciona (se mantiene centrado en el protagonista).`
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

export async function generateInterviewContent(
  data: InterviewData
): Promise<GeneratedContent> {
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
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: formatInterviewForAI(data) },
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

  return JSON.parse(content) as GeneratedContent;
}
