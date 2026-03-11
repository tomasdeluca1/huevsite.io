export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown or HTML
  date: string;
  author: {
    name: string;
    username: string;
    avatarUrl: string;
  };
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "agente-ia-generador-sub-sites",
    title: "Generá un sub-site completo en 10 segundos con IA",
    excerpt: "Lanzamos el Agente de Sub-sites para usuarios PRO. Pegá la URL de tu startup, producto o post y la IA estructurará un portfolio increíble en segundos.",
    date: "2026-03-11", // Using roughly current date
    author: {
      name: "Tomas Deluca",
      username: "huevsite",
      avatarUrl: "https://sdijcsgsfvwwdehcllsm.supabase.co/storage/v1/object/public/assets/6e919edb-d649-412b-b5f8-0263b60ffa0e/avatars/4dt5yx2f1qs-1771790082443.jpg", // placeholder
    },
    content: `
Armar un portfolio desde cero puede ser tedioso. Pensar qué métricas destacar, escribir el copy perfecto, acomodar las features en una grilla... a veces solo queremos armar algo rápido que se vea increíble.

Hoy lanzamos una **nueva feature exclusiva para usuarios PRO**: el Agente IA de Sub-sites.

## ¿Qué es?
Es una herramienta mágica en tu dashboard de configuraciones PRO. Simplemente pegás la URL de cualquier cosa que hayas construido (una landing page, un repositorio de GitHub, un artículo largo), y huevsite.io se encarga del resto.

### ¿Cómo funciona la magia?
Atrás de escena, armamos un workflow poderoso:
1. Usamos **Jina AI** para ir a tu página, limpiar todo el ruido inútil (menús, cookies, scripts) y extraer el contenido real en formato markdown.
2. Le pasamos ese contexto purificado a **Google Gemini 2.5 Flash** con un prompt de diseño exhaustivo.
3. La IA lee nuestro **AI_BLOCK_GUIDELINES** (las buenas prácticas de diseño de huevsite) y determina qué información debe ir en la cabecera (\`hero\`), qué números destacar (\`metric\`), qué imágenes extraer (\`project\`) y qué tecnologías resaltan (\`building\`).
4. Boom. En 10 segundos tienes un sub-site creado y alojado en \`huevsite.io/tu-usuario/slug-del-proyecto\`.

## Mejores Prácticas: Cómo optimizamos el prompt
Tuvimos que enseñarle a la IA a "pensar como huevsite".

- **Impacto visual**: Le enseñamos que las métricas (ej. "$5K MRR" o "10k Users") deben ir en bloques \`metric\` dedicados, no escondidas en texto.
- **Jerarquía**: El \`hero\` siempre va primero ocupando espacio doble.
- **Extracción de Imágenes**: Le dimos la instrucción estricta de buscar imágenes markdown (\`![alt](url)\`) y populares bloques \`project\` visuales. ¡Tu portfolio no va a ser solo texto aburrido!

Siendo usuario PRO ya podés entrar a tus ajustes (PRO Settings -> Sub-sites) y probar la sección "Magic".

¡A buildeaRRR!
    `,
  }, {
    slug: "el-fin-de-huevsite",
    title: "Por qué creamos huevsite.io: El portfolio definitivo para la comunidad tech",
    excerpt: "Unificando a los builders, developers y creadores de LATAM bajo una misma red orientada a la acción y a construir impacto real.",
    date: "2026-03-04",
    author: {
      name: "Tomas Deluca",
      username: "huevsite",
      avatarUrl: "https://sdijcsgsfvwwdehcllsm.supabase.co/storage/v1/object/public/assets/6e919edb-d649-412b-b5f8-0263b60ffa0e/avatars/4dt5yx2f1qs-1771790082443.jpg",
    },
    content: `
Tener un buen portfolio siempre fue un dolor de cabeza para los desarrolladores y creadores. O armás algo súper customizado que te lleva semanas mantener, o terminás usando un template genérico que no destaca ni tus métricas, ni tu impacto real.

Así nació **huevsite.io**. 

Nuestra visión no es ser otra plataforma de "link in bio" aburrida. Queremos ser la carta de presentación definitiva para la comunidad tech de Argentina y LATAM. Un lugar donde los profesionales puedan mostrar lo que realmente importa: los proyectos que están buildeando, las tecnologías que usan, las métricas de sus productos, y las comunidades de las que forman parte.

## Diseñado para Builders
Si sos developer, indie hacker, diseñador o creador de contenido técnico, tu carta de presentación debe gritar profesionalismo y "hacker vibes". Por eso creamos un sistema de bloques estilo *bento box*:
- **Foco en el impacto**: Con bloques de métricas, podés mostrar tus estrellas en GitHub, tu MRR o tu cantidad de usuarios.
- **Accionable**: Con bloques de proyectos con imágenes directas, reducís la fricción para que la gente pruebe lo que hacés.
- **Identidad técnica**: Mostrá las herramientas de tu stack de desarrollo de una forma visual.

## Uniendo a LATAM
Más allá del portfolio personal, buscamos crear una red. Queremos unificar a la comunidad de creadores, dando un espacio centralizado para que puedas explorar lo que otros están construyendo, descubrir talento emergente y potenciar el ecosistema tecnológico regional.

**Es hora de buildeaRRR.**
    `,
  }

];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
