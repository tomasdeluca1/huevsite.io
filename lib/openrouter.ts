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
}

interface GeneratedContent {
  blogMarkdown: string;
  blogTitle: string;
  blogExcerpt: string;
  blogTags: string[];
  linkedinPost: string;
  twitterPost: string;
  instagramCaption: string;
}

const SYSTEM_PROMPT = `Sos un redactor de contenido para huevsite.io, una plataforma de builders que construyen productos en público.

Tu tarea es procesar las respuestas de una entrevista escrita al "Builder de la Semana" y generar 4 piezas de contenido.

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
  "instagramCaption": "Caption para IG (máx 2200 chars). Storytelling con saltos de línea, emojis moderados, hashtags al final"
}`;

function formatInterviewForAI(data: InterviewData): string {
  return `ENTREVISTA — Builder de la Semana

Builder: ${data.builderName} (@${data.builderUsername})
Perfil: https://huevsite.io/${data.builderUsername}

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
