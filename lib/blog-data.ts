import { calculateReadingTime } from "./utils";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown or HTML
  date: string;
  tags: string[];
  readingTime?: number;
  author: {
    name: string;
    username: string;
    avatarUrl: string;
  };
}

const RAW_BLOG_POSTS: Omit<BlogPost, 'readingTime'>[] = [
  {
    slug: "subi-de-nivel-todo-sobre-el-builder-score",
    title: "Subí de nivel: Todo sobre el Builder Score",
    excerpt: "Descubrí cómo funciona nuestro sistema de puntuación y qué podés hacer para aparecer en lo más alto de la sección Explore.",
    date: "2026-03-15",
    tags: ["gamification", "comunidad", "ranking"],
    author: {
      name: "Tomas Deluca",
      username: "huevsite",
      avatarUrl: "https://sdijcsgsfvwwdehcllsm.supabase.co/storage/v1/object/public/assets/6e919edb-d649-412b-b5f8-0263b60ffa0e/avatars/4dt5yx2f1qs-1771790082443.jpg",
    },
    content: `
¿Te preguntaste por qué algunos perfiles aparecen primero en la sección Explore? O ¿qué significa ese número al lado de tu nombre? 

Hoy te contamos todo sobre el **Builder Score**, el sistema que reconoce tu actividad y la calidad de tu portfolio en huevsite.io.

## ¿Qué es el Builder Score?
No es solo un número; es el reflejo de tu impacto como builder. El score se calcula automáticamente analizando la integridad de tu perfil, el contenido que compartís y cómo interactuás con otros miembros de la comunidad.

## ¿Cómo sumar puntos?
El sistema premia tres pilares fundamentales:

### 1. Perfil Completo (Base)
Tener una foto de perfil, un nombre claro y una descripción (tagline) de más de 10 caracteres te da tus primeros **100 puntos**. Es lo esencial para que otros builders te tomen en serio.

### 2. Calidad de Contenido
Los bloques que agregás tienen distintos pesos:
- **Proyectos (Project blocks)**: Los primeros 3 proyectos que subas te dan **75 puntos cada uno**. Es la mejor forma de empezar.
- **En construcción (Building)**: Compartir qué estás buildeando hoy suma **30 puntos**.
- **GitHub**: Conectar tu cuenta de GitHub es un gran impulso, ¡te da **150 puntos** instantáneos!
- **Diversidad**: Si tenés al menos un bloque de Proyecto, uno de Building y uno de Writing (escritura), recibís un **bonus de 100 puntos** por ser un builder multifacético.

### 3. Impacto Social e Interacción
huevsite es una red de builders. Por eso premiamos la reciprocidad:
- **Endorsements**: Cada recomendación que recibas de otros suma **25 puntos**.
- **Nominaciones**: Si alguien te nomina para \"Builder de la Semana\", sumás **15 puntos**.
- **Seguidores**: Cada nuevo follower vale por **10 puntos**.
- **Dar amor**: También sumás puntos por recomendar a otros y nominarlos. ¡La comunidad crece junta!

### 4. Bono de Visibilidad
Si tu perfil recibe visitas únicas en los últimos 30 días, el sistema lo detecta y te premia con hasta **200 puntos extra**. ¡Es hora de compartir ese link!

## ¿Para qué sirve?
Aparecer arriba en el **Explore** no es solo vanidad. Es visibilidad ante reclutadores, potenciales socios y clientes que buscan talento en LATAM. Además, estamos trabajando en beneficios exclusivos para los top builders de la plataforma.

**¿Qué esperás? Entrá a tu dashboard, completá esos bloques y empezá a subir en el ranking.**

¡A buildeaRRR!
    `,
  },
  {
    slug: "presentamos-insights-quien-esta-viendo-tu-portfolio",
    title: "Presentamos Insights: ¿Quién está viendo tu portfolio?",
    excerpt: "Ya no tenés que adivinar. Ahora podés ver cuánta gente te visita, de dónde vienen y qué dispositivos usan en tiempo real.",
    date: "2026-03-15",
    tags: ["feature", "analytics", "pro"],
    author: {
      name: "Tomas Deluca",
      username: "huevsite",
      avatarUrl: "https://sdijcsgsfvwwdehcllsm.supabase.co/storage/v1/object/public/assets/6e919edb-d649-412b-b5f8-0263b60ffa0e/avatars/4dt5yx2f1qs-1771790082443.jpg",
    },
    content: `
Uno de los mayores problemas de los portfolios estáticos es que son un \"agujero negro\". Lo compartís en LinkedIn o X, pero no sabés si alguien realmente hizo clic, si lo leyeron desde el celular o si ese reclutador de la empresa que te gusta entró a mirar.

Hoy lanzamos **Insights**, una herramienta de analíticas potente, privada y visual diseñada específicamente para builders.

## Toda tu audiencia en un solo lugar
Dentro de tu dashboard (sección Insights), ahora vas a encontrar un panel detallado que te muestra:

- **Visitantes Únicos**: Cuántas personas reales entraron a tu huevsite.
- **Fuentes de Tráfico (Referrers)**: ¿Vienen de un tweet que hiciste? ¿De tu bio de LinkedIn? ¿De un mensaje de WhatsApp? Ahora podés saber exactamente qué canal te está funcionando mejor.
- **Geografía y Dispositivos**: Entendé si tu audiencia es local o internacional, y si ven tu sitio en desktop o mobile para optimizar tu diseño.
- **Top Blocks**: ¿Cuál es el proyecto que genera más curiosidad? Medimos los clics en tus bloques para que sepas qué es lo que más destaca de tu perfil.

## Privacidad por diseño
A diferencia de otras herramientas pesadas como Google Analytics, huevsite Insights es:
1. **Liviano**: No ralentiza la carga de tu perfil.
2. **Privado**: No rastreamos datos personales. Usamos identificadores anónimos para darte métricas precisas sin invadir la privacidad de nadie.
3. **Integrado**: No tenés que configurar nada. Si tenés una cuenta, ya estás recolectando datos (aunque el acceso detallado es una feature para usuarios PRO).

## ¿Cómo usar estos datos?
Si notás que mucha gente entra a tu perfil pero nadie hace clic en tu botón de contacto, quizás sea momento de mover ese bloque más arriba o cambiar el color de acento. Si ves que el 90% de tus visitas son desde mobile, asegurate de que tus textos sean breves y concisos.

**Los datos son poder. Empezá a medir el impacto de tu marca personal hoy mismo con Insights.**

¡A buildeaRRR!
    `,
  },
  {
    slug: "tu-carta-de-presentacion-ahora-viaja-con-vos-nuevas-imagenes-al-compartir",
    title: "Tu imagen viaja con vos: Nuevas OpenGraph cards",
    excerpt: "Cuando pegás tu link en WhatsApp, X o Slack, ya no se ve un recuadro genérico. Ahora tu portfolio genera una tarjeta con tu cara, tus colores y tu propia descripción.",
    date: "2026-03-14",
    tags: ["feature", "perfil", "update"],
    author: {
      name: "Tomas Deluca",
      username: "huevsite",
      avatarUrl: "https://sdijcsgsfvwwdehcllsm.supabase.co/storage/v1/object/public/assets/6e919edb-d649-412b-b5f8-0263b60ffa0e/avatars/4dt5yx2f1qs-1771790082443.jpg",
    },
    content: `
Si alguna vez compartiste el enlace a tu portfolio en un chat o en tus redes sociales, habrás notado que a veces la imagen que acompaña al enlace no es exactamente tuya. O peor: a veces ni siquiera carga tu foto de perfil.

¡Eso acaba de cambiar! 

Esta semana reescribimos desde cero el motor que genera esas "tarjetitas" (técnicamente conocidas como imágenes Open Graph).

## ¿Qué cambió exactamente?

A partir de hoy, cada vez que alguien pegue tu link de **huevsite.io/tu-usuario** en plataformas como WhatsApp, Slack, LinkedIn, X o Discord, el sistema va a leer **tu perfil en tiempo real** y va a fabricar una imagen de portada única y exclusivamente para vos.

Esta nueva imagen ahora incluye:
- **Tu foto de perfil (Avatar)** en el centro de atención.
- **Tu propio color de acento** decorando la tarjeta.
- **Tu nombre y título exactos**, para que sepan quién sos antes de hacer clic.

Si por algún motivo no habías subido todavía una foto de perfil, ¡no te preocupes! El sistema es suficientemente inteligente como para dibujarte un ícono redondo y elegante con la **letra inicial de tu nombre** bañado en tus colores de marca, para que tu portfolio nunca deje de verse profesional.

## ¿Por qué esto es importante?

*La primera impresión cuenta.* Cuando aplicás a un trabajo o cuando le pasás tu portfolio a un potencial socio, la miniatura de la conversación es lo primero que van a ver. Ahora tenés el control visual completo sobre tu marca antes siquiera de que entren a tu huevsite.

**Probá vos mismo el cambio:** copialo desde tu navegador y pegalo por WhatsApp a un amigo o familiar. 

¡A buildeaRRR!
    `,
  },
  {
    slug: "5-tips-para-un-portfolio-que-cierre-clientes",
    title: "5 Tips para un Portfolio que cierre clientes",
    excerpt: "No todos los bloques son iguales. Aprendé a organizar tu huevsite para destacar tus mejores proyectos y convertir visitas en oportunidades.",
    date: "2026-03-14",
    tags: ["design", "tips", "portfolio"],
    author: {
      name: "Tomas Deluca",
      username: "huevsite",
      avatarUrl: "https://sdijcsgsfvwwdehcllsm.supabase.co/storage/v1/object/public/assets/6e919edb-d649-412b-b5f8-0263b60ffa0e/avatars/4dt5yx2f1qs-1771790082443.jpg",
    },
    content: `
Tener un huevsite es el primer paso, pero optimizarlo es lo que realmente marca la diferencia entre ser un builder más y ser \"el\" builder que todos quieren contratar o seguir.

Acá te dejamos 5 consejos prácticos para llevar tu bento-box al siguiente nivel:

### 1. La jerarquía visual es Rey
El primer bloque (normalmente el Hero) debe decir claramente quién sos y qué hacés. Pero no te detengas ahí. Usá el doble ancho (col_span: 2) para tus 1 o 2 proyectos más importantes. Lo que el usuario ve sin hacer scroll es lo más crítico.

### 2. Mostrá métricas, no solo código
A los clientes y reclutadores les encantan los números. En lugar de decir \"Desarrollé una app de finanzas\", usá un bloque de **Metric** que diga \"+1,000 usuarios activos\" o \"$500 MRR\". El impacto tangible vence a las descripciones técnicas aburridas.

### 3. Tu color de acento es tu marca
No elijas un color al azar. Tu \`accent_color\` tiñe los botones, los bordes y las tarjetas Open Graph cuando compartís tu link. Usá un color que contraste bien con el fondo oscuro y que represente tu personalidad (un cian tech, un naranja vibrante o un violeta elegante).

### 4. Mantené el \"Building\" actualizado
El bloque **Building** es tu feed de actividad. No tiene que ser un proyecto terminado. Poné \"Refactorizando el motor de búsqueda\" o \"Aprendiendo Rust\". Esto demuestra que sos un builder activo y curioso, algo que genera muchísima confianza.

### 5. Llamado a la acción (CTA) claro
¿Querés que te sigan en Twitter? ¿Que te manden un mail? ¿Que agenden una llamada? Asegurate de tener bloque de redes sociales o un link directo bien visible. No hagas que la gente tenga que buscar cómo contactarte.

---

**Bonus Pro Tip**: Usá sub-sites para tus proyectos individuales. No satures tu perfil principal con 20 bloques. Creá una \"página hija\" para ese proyecto grande y dejá que brille por sí solo en su propia URL.

¡A buildeaRRR!
    `,
  },
  {
    slug: "dominios-custom-tu-nombre-punto-com",
    title: "Lanzamos Dominios Custom para usuarios PROs",
    excerpt: "Ya no dependas de huevsite.io/tu-usuario. Ahora podés conectar tu propio dominio (ej: builder.com) y llevar tu portfolio al siguiente nivel.",
    date: "2026-03-12",
    tags: ["feature", "pro", "portfolio"],
    author: {
      name: "Tomas Deluca",
      username: "huevsite",
      avatarUrl: "https://sdijcsgsfvwwdehcllsm.supabase.co/storage/v1/object/public/assets/6e919edb-d649-412b-b5f8-0263b60ffa0e/avatars/4dt5yx2f1qs-1771790082443.jpg",
    },
    content: `
Si sos un builder serio, tu URL importa. huevsite.io/tu-nombre está buenísimo para arrancar, pero cuando querés cerrar ese cliente premium o aplicar a una startup top de US, tener **tu-nombre.com** o **tu-startup.io** apuntando directo a tu portfolio bento-box no tiene comparación.

Hoy liberamos la funcionalidad de **Custom Domains** para todos los usuarios PRO.

## ¿Por qué usar un dominio propio?

Tener un dominio custom no es solo una cuestión estética, es control total sobre tu marca personal:
- **Profesionalismo instantáneo**: Un dominio propio genera una confianza que una URL compartida no logra alcanzar.
- **Portabilidad**: Sos dueño de tu tráfico. Si decidís apuntar tu dominio a otro lado en el futuro, tus enlaces impresos en tarjetas o bios de Twitter nunca mueren.
- **SEO Directo**: Toda la autoridad de búsqueda se acumula en *tu* dominio, no en el nuestro.

## ¿Es difícil configurarlo?

Lo hicimos para que lo haga mi abuela. Bueno, casi.
Utilizamos la infraestructura de **Vercel Domains** para que la conexión sea rápida y segura:

1. Entrás a **PRO Settings** en tu dashboard.
2. Escribís tu dominio (ej: \`tomasdeluca.io\`).
3. Te damos los registros DNS (\`A\` o \`CNAME\`).
4. Lo pegás en tu registrador (GoDaddy, Namecheap, etc) y listo.

En minutos, nuestro sistema genera un certificado SSL automático y tu sitio está online con HTTPS.

## Bonus: Sub-sites en tu dominio

Lo mejor es que tus sub-sites (los que creaste con nuestra IA o a mano) también cuelgan de tu dominio. Si conectás \`tomasdeluca.io\`, tu proyecto de la hackaton va a estar en \`tomasdeluca.io/mi-proyecto\`. 

Es, literalmente, un constructor de sitios estáticos profesional disfrazado de red social de builders.

**Subí de liga hoy conectando tu dominio.**

¡A buildeaRRR!
    `,
  },
  {
    slug: "agente-ia-generador-sub-sites",
    title: "Generá sub-sites en 10s con nuestra nueva IA",
    excerpt: "Lanzamos el Agente de Sub-sites para usuarios PRO. Pegá la URL de tu startup, producto o post y la IA estructurará un portfolio increíble en segundos.",
    date: "2026-03-11", // Using roughly current date
    tags: ["ai", "pro", "feature"],
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
  },
  {
    slug: "el-fin-de-huevsite",
    title: "Por qué creamos huevsite: El portfolio definitivo",
    excerpt: "Unificando a los builders, developers y creadores de LATAM bajo una misma red orientada a la acción y a construir impacto real.",
    date: "2026-03-04",
    tags: ["comunidad", "vision", "startup"],
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

// Pre-calculate reading time for all posts
export const BLOG_POSTS: BlogPost[] = RAW_BLOG_POSTS.map(post => ({
  ...post,
  readingTime: calculateReadingTime(post.content)
}));

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug.toLowerCase() === slug.toLowerCase());
}
