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
    slug: "importa-tu-linktree-o-bio-site-y-arranca-con-un-board-de-verdad",
    title: "Importá tu Linktree o Bio Site y arrancá con un board de verdad",
    excerpt: "El onboarding ahora puede traerse tu avatar, bio y links visibles desde Linktree o Bio Site para que no empieces desde cero ni armes un perfil genérico.",
    date: "2026-03-20",
    tags: ["onboarding", "linktree", "feature"],
    author: {
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
    },
    content: `
Arrancar un perfil desde cero puede ser una paja. Tenés que pensar el nombre, rearmar tus links, volver a escribir la bio y encima decidir qué mostrar primero.

Por eso sumamos una mejora fuerte al onboarding: **ahora podés importar tu Linktree o Bio Site y usar esa data real para construir tu huevsite desde el arranque**.

## Qué se importa
Cuando pegás la URL, huevsite lee lo visible y recupera:

- avatar
- nombre o display name
- bio
- links destacados
- thumbnails cuando existen

No es un simple copy-paste de enlaces. El sistema además intenta **clasificar cada link** para ubicarlo mejor dentro del board:

- sociales
- proyectos
- writing
- media
- comunidad

Eso hace que el perfil inicial ya salga con bastante más criterio.

## Menos setup manual, más señal real
La gracia no es ahorrarte 30 segundos. La gracia es que tu perfil ya nazca con señales que dicen algo de vos.

Si venís de Linktree o Bio Site, ya tenés branding, bio y un orden mínimo de prioridades. Aprovechar eso hace que huevsite no arranque vacío ni con contenido de mentira.

En vez de inventar bloques para completar, ahora podés partir de:

- proyectos que ya compartías
- canales donde ya publicás
- comunidad donde ya existís
- una identidad visual más consistente

## También mejora el refactor del board
Esta lógica no vive solo en el onboarding.

Ahora también existe una forma de **rehacer el board principal desde Linktree** usando créditos IA, priorizando:

- nombre
- tagline
- links más importantes

Eso sirve mucho si tu perfil actual quedó viejo, desordenado o si querés reconstruirlo más rápido sin tocar tus sub-sites.

## Además, el layout ya no depende de que elijas una plantilla a ciegas
Otra mejora silenciosa pero muy útil: el onboarding ahora selecciona automáticamente un layout inicial para que no tengas que frenarte en decisiones de interfaz demasiado temprano.

Primero cargás tu señal.
Después ajustás.

Ese orden es mucho mejor para publicar rápido.

**Si ya tenías un Linktree armado, ahora podés convertirlo en un huevsite con mucha menos fricción y bastante más intención.**

¡A buildeaRRR!
    `,
  },
  {
    slug: "dominios-custom-sin-adivinar-que-dns-te-falta",
    title: "Dominios custom sin adivinar qué DNS te falta",
    excerpt: "Rediseñamos la conexión de dominios para que sepas exactamente qué guardar, qué copiar y cuándo verificar, sin navegar un setup confuso.",
    date: "2026-03-20",
    tags: ["pro", "dominios", "feature"],
    author: {
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
    },
    content: `
Conectar un dominio custom debería sentirse como un upgrade premium. No como una búsqueda del tesoro entre registros DNS, capturas viejas y mensajes ambiguos.

Por eso rehicimos el flujo de dominios en huevsite.

## Ahora el proceso es mucho más claro
La nueva experiencia te guía en tres pasos bien concretos:

1. elegís el dominio exacto
2. copiás el registro DNS correcto
3. corrés el check cuando propagó

Puede parecer obvio, pero antes mucha fricción venía de no saber cuál era el próximo paso real.

## Menos interpretación, más instrucciones accionables
El sistema ahora te muestra con claridad:

- si estás conectando un dominio raíz o un subdominio
- qué tipo de registro tenés que crear
- qué host usar
- a qué valor tiene que apuntar

Eso reduce muchísimo el clásico problema de:

- guardar un dominio mal normalizado
- cargar un \`www\` cuando no corresponde
- o verificar antes de tiempo sin entender qué faltaba

## Verificación más honesta
Otra mejora importante es el check.

Si Vercel ya ve el dominio como configurado y verificado, te lo decimos. Si el DNS parece correcto pero el SSL todavía está procesando, también.

Ese matiz importa porque evita la sensación de “hice todo bien y igual no sé si funciona”.

## El resultado: más confianza para usar tu propia marca
Conectar un dominio propio cambia bastante la percepción de un perfil. No solo se ve más serio. También se siente más tuyo.

La mejora acá no es solo técnica. Es psicológica:

- menos miedo a romper algo
- menos soporte manual
- más claridad para completar el setup

**Si tenías frenado tu dominio por miedo al DNS, ahora el camino es bastante más directo.**

¡A buildeaRRR!
    `,
  },
  {
    slug: "eliminar-tu-cuenta-sin-escribirle-a-soporte",
    title: "Eliminar tu cuenta, sin escribirle a soporte",
    excerpt: "Sumamos borrado de cuenta con confirmación explícita para que cada builder tenga salida real del producto sin depender de mensajes manuales.",
    date: "2026-03-20",
    tags: ["cuenta", "privacidad", "update"],
    author: {
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
    },
    content: `
Un producto serio no solo te deja entrar fácil. También te deja salir con claridad.

Por eso sumamos una función que hacía falta: **ahora podés eliminar tu cuenta desde el dashboard, sin depender de soporte**.

## Qué incluye este borrado
La acción está pensada como una eliminación real de cuenta y contenido asociado. El flujo contempla:

- acceso del usuario
- perfil
- sub-sites
- bloques
- actividad
- assets subidos

Si además tenías un dominio custom conectado, el sistema también remueve esa asociación antes de cerrar todo.

## Confirmación manual para evitar accidentes
Como es una acción irreversible, no alcanza con un botón rojo.

Implementamos una confirmación explícita donde tenés que escribir una frase exacta antes de avanzar. Eso agrega una pausa saludable y evita borrados por error, clicks impulsivos o confusión dentro del dashboard.

## Más autonomía, menos tickets innecesarios
Esta feature no está para empujar a nadie a irse. Está para que el producto sea más honesto.

Dar control real también significa:

- no esconder la salida
- no obligarte a hablar con alguien
- no dejar datos colgados por un proceso manual

En productos chicos, este tipo de cosas suele postergarse. Nosotros preferimos resolverlas temprano.

## Un detalle que también construye confianza
Tener una opción clara de borrado mejora la percepción general del producto, incluso si nunca la usás.

Porque transmite algo simple:

**tu cuenta es tuya, y tu decisión también.**

¡A buildeaRRR!
    `,
  },
  {
    slug: "reclama-tu-username-y-publica-tu-huevsite-en-minutos",
    title: "Reclamá tu username y publicá tu huevsite en minutos",
    excerpt: "Ahora podés probar si tu URL está libre antes de entrar al onboarding. Menos fricción, más intención real y un camino mucho más rápido para salir publicado.",
    date: "2026-03-18",
    tags: ["onboarding", "feature", "perfil"],
    author: {
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
    },
    content: `
Elegir un username no parece gran cosa, hasta que te das cuenta de que esa URL va a aparecer en tu bio, en tu CV, en tus mensajes privados y en cada link que compartas.

Por eso sumamos una mejora simple pero poderosa: **ahora podés probar y reclamar tu username antes de meterte de lleno en el onboarding**.

## Qué cambia
En vez de hacerte entrar, navegar, pensar y recién ahí enterarte de que el nombre que querías ya estaba tomado, ahora el flujo arranca al revés:

1. Escribís tu username ideal.
2. huevsite te dice si está libre.
3. Si está disponible, te lo llevamos precargado al setup.

Es un cambio chico en interfaz, pero enorme en intención. Cuando alguien ya ve \`huevsite.io/su-nombre\` frente a sus ojos, deja de imaginar el producto y empieza a proyectarse adentro.

## Menos fricción, más acción
Este tipo de decisión temprana mejora dos cosas:

- **Reduce rebote**: en vez de scrollear una landing eterna, el usuario interactúa con algo concreto.
- **Aumenta compromiso**: quien ya eligió username llegó un paso más cerca de publicar.

Y si el nombre ya fue manoteado, ahora también sugerimos variantes para que no se corte el impulso.

## Por qué importa tanto tu URL
Tu huevsite no es una cuenta más. Es una dirección pública para mostrar:

- qué construís
- en qué estás trabajando ahora
- tus proyectos más serios
- señales sociales como follows, endorsements o nominaciones

Esa URL es tu punto de entrada. Si la sentís propia, tenés muchas más chances de usarla de verdad.

## Ideal para compartir desde el día uno
El objetivo no es que pases una hora “configurando”. Es que puedas salir con algo publicable en muy poco tiempo:

- username definido
- perfil visible
- blocks básicos cargados
- link listo para mandar

**Si todavía no reclamaste el tuyo, este es el mejor momento para hacerlo antes de que llegue alguien con tu mismo nombre.**

¡A buildeaRRR!
    `,
  },
  {
    slug: "feed-follow-endorsements-la-capa-social-de-huevsite",
    title: "Feed, follows y endorsements: la capa social de huevsite",
    excerpt: "Tu portfolio ya no vive aislado. Entre feed global, follows, endorsements y nominaciones, huevsite se vuelve una red para builders que realmente están en movimiento.",
    date: "2026-03-18",
    tags: ["comunidad", "social", "feature"],
    author: {
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
    },
    content: `
Un portfolio sirve para mostrar. Una red sirve para circular. huevsite quiere hacer las dos cosas.

Por eso, además de tu perfil público, cada vez hay más funciones pensadas para que el ecosistema se mueva:

- **Feed global**
- **Follows entre builders**
- **Endorsements**
- **Nominaciones al showcase**

## El feed global: actividad, no humo
El feed no está para llenar pantalla. Está para responder una pregunta simple:

**¿Quién está construyendo qué, hoy?**

Ahí viven cambios de perfil, nuevos bloques, lanzamientos, movimientos relevantes y señales de que la gente no abandonó su página después de crearla.

Eso hace que descubrir builders no dependa solo de rankings. También podés entrar por momentum.

## Follows y endorsements
Seguir a alguien en huevsite no es solo “me cae bien”. Es una forma de decir:

- quiero ver qué sigue construyendo
- quiero tenerlo en el radar
- me interesa su estilo, su nivel o su consistencia

Los **endorsements** van un paso más allá. Son señal pública de confianza. No reemplazan a un caso de estudio ni a un buen proyecto, pero sí ayudan a que otros entiendan rápido si detrás del perfil hay alguien que realmente entrega.

## Showcase y nominaciones
La lógica del showcase suma una capa semanal de visibilidad. En vez de dejar todo librado al algoritmo, abrimos una dinámica más humana: builders nominando builders.

Eso genera algo sano:

- más descubrimiento
- más reciprocidad
- más contexto social alrededor del trabajo

No es popularidad vacía. Es reputación en movimiento.

## Tu perfil ya no está solo
La mejor parte de esta capa social es que hace más útil cada bloque de tu huevsite.

Tu proyecto deja de ser “algo que subiste” y pasa a ser:

- algo que aparece en actividad
- algo que puede generar follows
- algo que puede recibir endorsements
- algo que puede empujarte a más visibilidad

**Si ya tenés tu huevsite publicado, ahora también tenés una red para moverlo.**

¡A buildeaRRR!
    `,
  },
  {
    slug: "cuando-conviene-crear-un-sub-site-y-no-meter-todo-en-el-mismo-perfil",
    title: "Cuándo conviene crear un sub-site y no meter todo en el mismo perfil",
    excerpt: "No todo merece vivir en tu board principal. Te contamos cuándo conviene abrir un sub-site, qué tipo de proyectos se benefician y cómo ordenarlo sin saturar tu perfil.",
    date: "2026-03-18",
    tags: ["sub-sites", "portfolio", "tips"],
    author: {
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
    },
    content: `
Uno de los errores más comunes en portfolios de builders es querer meter absolutamente todo en la home principal.

Resultado: demasiados bloques, poca jerarquía y ninguna historia clara.

Para eso existen los **sub-sites**.

## Qué es un sub-site
Es una página hija dentro de tu mismo universo. Mantiene tu identidad, cuelga de tu username o dominio y te deja dedicarle una URL específica a un proyecto, producto o experimento.

Ejemplos:

- tu startup principal
- un side project que ya tiene tracción
- un curso o newsletter
- un experimento visual
- una landing para una hackathon

## Cuándo conviene abrir uno
La regla simple es esta:

**si un proyecto necesita contexto propio, merece su sub-site.**

Abrí un sub-site cuando:

1. Tenés demasiado material para un solo bloque.
2. Querés compartir una URL específica de un producto.
3. Necesitás una narrativa más enfocada.
4. El proyecto tiene branding, métricas o assets propios.

## Cuándo NO conviene
No todo necesita una página hija. Si es apenas una prueba, un repo chico o algo que todavía no tiene forma, probablemente alcance con un bloque dentro de tu perfil principal.

Tu board principal debería responder:

- quién sos
- qué hacés
- qué proyectos importan más

Los sub-sites están para profundizar, no para reemplazar esa síntesis.

## Cómo usarlos bien
Una forma simple de pensarlo:

- **Perfil principal**: identidad, credibilidad, overview.
- **Sub-site**: foco, detalle, CTA específico.

Eso te permite compartir mejor.

En vez de mandar a alguien a un perfil general donde tiene que buscar, le pasás directamente:

\`huevsite.io/tuusuario/tu-proyecto\`

o incluso el path correspondiente bajo tu dominio custom si sos PRO.

## Menos ruido, más claridad
El mejor uso de sub-sites no es “tener más páginas”. Es lograr que cada visita llegue al lugar correcto con menos fricción.

Si tu perfil principal ya está empezando a parecer un depósito de cosas, probablemente no necesites borrar nada. **Necesitás separar mejor.**

**Pensá tu perfil como índice y tus sub-sites como capítulos.**

¡A buildeaRRR!
    `,
  },
  {
    slug: "invita-builders-y-gana-pro-gratis",
    title: "Ganá PRO invitando Builders: Lanzamos el Sistema de Referidos",
    excerpt: "Queremos que la comunidad crezca. Ahora, por cada 3 amigos que se sumen a huevsite y activen su cuenta, te regalamos 3 meses de PRO gratis.",
    date: "2026-03-17",
    tags: ["comunidad", "referidos", "pro"],
    author: {
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
    },
    content: `
huevsite.io nació para ser el punto de encuentro de los builders de LATAM. Y como sabemos que los mejores builders siempre están rodeados de gente con el mismo mindset, hoy lanzamos el **Sistema de Referidos**.

## Buildeá con amigos y ganá PRO 🥚✨
Ya no tenés que esperar para desbloquear las métricas premium o conectar tu dominio.

**¿Cómo funciona?**
1. Entrá a tu **Dashboard**.
2. Copiá tu **Referral Code**.
3. Compartilo con esos amigos que todavía no tienen su perfil en huevsite.

Por cada **3 personas** que completen su perfil usando tu código, el sistema te va a activar automáticamente **3 meses de huevsite PRO** totalmente gratis. 

## Recompensas Acumulables
Lo mejor es que esto se suma. Si traés a 6 amigos, tenés 6 meses. Si traés a 9, tenés casi un año de suscripción PRO sin poner un solo peso. 

Esta es nuestra forma de devolverle algo a los builders que están ayudando a que este ecosistema crezca día a día.

**¡Buscá tu código en el Dashboard y empezá a invitar!**

¡A buildeaRRR!
    `,
  },
  {
    slug: "automatizacion-x-cada-hito-cuenta",
    title: "Tu progreso en el radar: Automatizaciones y Preview de Tweets",
    excerpt: "Desde bienvenidas personalizadas hasta reportes semanales. Potenciamos nuestra integración con X para que el ecosistema se entere de lo que estás buildeando.",
    date: "2026-03-17",
    tags: ["twitter", "automatizacion", "admin"],
    author: {
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
    },
    content: `
La comunidad de builders vive en X (Twitter), y huevsite.io ahora tiene una integración mucho más profunda para que tu actividad no pase desapercibida. 

## Bienvenido a la Tribu
A partir de ahora, cada vez que un builder conecte su cuenta de Twitter y cree su perfil, nuestra cuenta oficial le dará una **Bienvenida personalizada**. Es la mejor forma de empezar a ganar visibilidad desde el minuto uno.

## Hitos de Comunidad
No solo celebramos perfiles individuales. Cuando alcanzamos hitos como los **150 o 200 builders**, el sistema genera un post de celebración. ¡Cada vez somos más!

## Reportes Semanales y Leaderboards
Todos los viernes, el sistema analizará la actividad de la plataforma y publicará:
- **Stats de la semana**: Cuántos proyectos se lanzaron y cuántos builders nuevos se sumaron.
- **Top Builders (Non Pro)**: Queremos destacar específicamente a quienes están empezando, por eso lanzaremos rankings exclusivos de builders que no tienen el plan PRO para darles ese empujón de visibilidad que necesitan.

## Control Total: Preview en Admin
Para que nuestra comunicación sea impecable, hemos implementado un sistema de **Preview**. Ahora, antes de publicar cualquier ranking o reporte semanal en X, el equipo administrador de huevsite puede previsualizar cómo se verá el tweet exacto, confirmando que cada mención y cada dato sea perfecto antes de que el ecosistema lo vea.

**¿Tu perfil ya está listo para salir en el próximo reporte semanal?**

¡A buildeaRRR!
    `,
  },
  {
    slug: "insights-3-0-quien-esta-del-otro-lado",
    title: "Insights 3.0: ¿Quién está realmente del otro lado?",
    excerpt: "Mejoramos el panel de analíticas para darte detalles granulares sobre tus visitas: dispositivos, orígenes de tráfico y una navegación por sesiones mucho más profunda.",
    date: "2026-03-17",
    tags: ["analytics", "pro", "feature"],
    author: {
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
    },
    content: `
Lanzamos **Insights 3.0**, la evolución definitiva de tus analiticas en huevsite.io. Si las métricas antes eran útiles, ahora son quirúrgicas.

## Navegación por Sesiones
Ya no solo vas a ver números agregados. Ahora implementamos un desglose de **Visitantes Recientes** donde podés explorar cada sesión individual:
- **Identificados vs Anónimos**: Mirá quiénes de los que te visitan tienen perfil en huevsite y quiénes son visitas externas.
- **Contexto Técnico Completo**: Filtramos por Navegador, Sistema Operativo y hasta el tipo de dispositivo exacto.
- **Micro-interacciones**: Entendé qué bloques específicos cliqueó un visitante durante su sesión. Esto es oro puro para saber si tu "Proyecto Destacado" realmente está destacando.

## Filtros de Tiempo Dinámicos
Ahora podés elegir rangos específicos: las últimas 24 horas, la última semana o ver el acumulado de los últimos 3 meses. Los gráficos se ajustan automáticamente para mostrarte la granularidad (por hora o por día) que necesites.

## Orígenes de Tráfico (Referrers) Precision
Mejoramos la detección de fuentes para que sepas exactamente si vienen de un link en X, una búsqueda en Google con intención alta, o si tu perfil está siendo compartido por WhatsApp o DMs (tráfico directo).

**Entrá ahora a la pestaña de Insights en tu dashboard y descubrí qué está pasando realmente en tu perfil.**

¡A buildeaRRR!
    `,
  },
  {
    slug: "showcase-semanal-celebrando-el-progreso-constante",
    title: "Showcase Semanal: Celebrando el progreso constante",
    excerpt: "Pasamos del 'Builder del mes' al 'Builder de la semana'. Más ganadores, más visibilidad y una integración total con X (Twitter) para que tu talento llegue más lejos.",
    date: "2026-03-16",
    tags: ["comunidad", "showcase", "Twitter"],
    author: {
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
    },
    content: `
En huevsite.io creemos que el building es una maratón, pero se corre paso a paso. Esperar un mes entero para celebrar a los builders que están rompiéndola se sentía demasiado lento. Por eso, hoy anunciamos el nuevo **Showcase Semanal**.

## Más Ritmo, Más Ganadores
A partir de ahora, la competencia por ser el Builder destacado se renueva cada semana. Esto significa:
- **Badge Dinámico en Explore**: Solo los ganadores de la *semana actual* llevarán el codiciado badge de "Builder de la Semana". Esto mantiene la sección Explore fresca y recompensa el esfuerzo reciente.
- **Destaque en el Perfil**: Tu badge ahora es dinámico y refleja tu estatus de ganador de forma prominente en tu Hero block y en tu header.

## Ahora en X (Twitter)
No queremos que tu éxito se quede solo dentro de huevsite. Hemos integrado un sistema automático que celebrará a los ganadores directamente en nuestra cuenta de X.
- **Anuncios de Ganadores**: Cada vez que se elija un builder destacado, saldrá un tweet automático mencionándote y mostrando tu perfil.
- **Leaderboards**: Periódicamente, publicaremos el Top 10 de builders basado en el **Builder Score**. ¡Es hora de subir ese puntaje para aparecer en el radar de toda la comunidad!

## ¿Cómo ganar?
El proceso no cambió, pero ahora es más dinámico. Los builders con más nominaciones de la semana pasan a ser finalistas, y de ahí se eligen los ganadores. Recordá que tener un perfil completo y conectar tus proyectos aumenta tus chances de que otros builders te nominen.

**¿Estás listo para ser el próximo Builder de la Semana?**

¡A buildeaRRR!
    `,
  },
  {
    slug: "insights-2-0-metricas-bento-style",
    title: "Insights 2.0: Métricas con estética Premium",
    excerpt: "Rediseñamos por completo el panel de Insights. Ahora tus analíticas se ven tan bien como tu portfolio, con gráficos fluidos y una nueva distribución bento-grid.",
    date: "2026-03-16",
    tags: ["feature", "analytics", "design"],
    author: {
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
    },
    content: `
Si sos un builder PRO, sabés que medir es fundamental. Pero, ¿por qué las herramientas de analíticas tienen que ser aburridas o feas? En huevsite.io nos obsesiona el diseño, y hoy lanzamos **Insights 2.0**.

## Una UI a la altura de tu Portfolio
Inspirados en la misma lógica bento-box de los perfiles, rediseñamos el dashboard de analíticas:
- **Bento Grid Layout**: Las métricas clave (Visitantes, Vistas, Rebote, CTR) ahora viven en tarjetas interactivas que se adaptan a cualquier pantalla.
- **Gráficos High-Fidelity**: Implementamos un sistema de renderizado custom para los gráficos de actividad. Son fluidos, animados y usan tus propios colores de acento para que la experiencia sea única.
- **Tipografía Consistente**: Llevamos nuestra fuente de display al dashboard para que los números no solo sean datos, sino que se sientan parte de una interfaz premium.

## Nuevas Métricas que importan
No solo es un cambio visual. Agregamos información más accionable:
- **Leaderboard de Contenido**: Mirá exactamente qué bloque de tu perfil está generando más interés. ¿Es tu último proyecto? ¿O quizás tu descripción de Stack técnico?
- **Actividad Reciente**: Un feed en tiempo real de los eventos que ocurren en tu sitio.
- **Optimización de Tráfico**: Filtramos automáticamente todo el tráfico de desarrollo (localhost) para que tus números sean 100% reales y representen a tu audiencia de producción.

## Privacidad Reafirmada
Seguimos cumpliendo nuestra promesa: métricas potentes sin cookies invasivas ni rastreo de datos personales. Vos sos dueño de tu data, y tus visitantes están protegidos.

**Entrá ahora a tu Dashboard y descubrí la nueva cara de tus métricas.**

¡A buildeaRRR!
    `,
  },
  {
    slug: "subi-de-nivel-todo-sobre-el-builder-score",
    title: "Subí de nivel: Todo sobre el Builder Score",
    excerpt: "Descubrí cómo funciona nuestro sistema de puntuación y qué podés hacer para aparecer en lo más alto de la sección Explore.",
    date: "2026-03-15",
    tags: ["gamification", "comunidad", "ranking"],
    author: {
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
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
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
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
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
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
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
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
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
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
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
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
    slug: "lanzamientos-reales-desde-tus-bloques-de-proyecto",
    title: "Lanzamientos reales: ahora tus bloques de proyecto alimentan el feed",
    excerpt: "La pestaña de lanzamientos ya no depende de una capa separada. Si publicás un bloque de proyecto en tu perfil o sub-site, aparece automáticamente donde la comunidad descubre qué se está shippeando.",
    date: "2026-03-18",
    tags: ["feed", "launches", "feature"],
    author: {
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
    },
    content: `
Durante mucho tiempo, “lanzamientos” y “proyectos reales” vivían demasiado separados.

Eso generaba una fricción rara: alguien podía tener un proyecto muy bueno publicado en su huevsite, pero igual no aparecer en la pestaña donde la comunidad entra a ver qué se está construyendo.

Eso ya no va más.

## Qué cambió
La sección de **Lanzamientos** ahora se alimenta directamente de tus **bloques \`project\`**.

Eso significa que si agregás un proyecto en:

- tu perfil principal
- un sub-site
- una página pública visible

ese proyecto ya puede aparecer automáticamente en el feed de lanzamientos.

## Menos duplicación, más verdad
La idea es simple:

**si ya cargaste un proyecto en huevsite, no deberías tener que “relanzarlo” en otro sistema paralelo para que exista.**

Ahora la fuente es una sola. Tu contenido real.

Eso mejora varias cosas:

- menos mantenimiento
- menos data duplicada
- más consistencia entre perfil, sub-sites y feed
- una pestaña de lanzamientos mucho más útil

## Qué conviene hacer para aparecer mejor
Si querés que tu proyecto destaque más en esa pestaña, vale la pena cuidar bien tu bloque:

1. Poné un título claro.
2. Sumá una descripción concreta.
3. Agregá preview visual si tenés.
4. Completá bien el link de destino.
5. Si el proyecto vive mejor solo, mandalo a un sub-site.

No hace falta “optimizar para algoritmo”. Hace falta que el proyecto se entienda rápido.

## Lanzamientos más vivos, menos humo
Con este cambio, la pestaña deja de ser una vidriera aislada y pasa a reflejar mejor el estado real del ecosistema.

Si la gente publica proyectos, aparecen.
Si los builders mejoran sus blocks, el feed mejora solo.

**En vez de inventar una capa extra, conectamos mejor la que ya existía.**

¡A buildeaRRR!
    `,
  },
  {
    slug: "feed-por-seguidos-o-todos-como-entrar-mejor-a-la-red",
    title: "Feed por Seguidos o Todos: dos formas de entrar mejor a la red",
    excerpt: "El feed ahora separa lo que sigue toda la comunidad de lo que te importa a vos. Con el filtro entre Seguidos y Todos, huevsite se vuelve más útil para descubrir y también para volver.",
    date: "2026-03-18",
    tags: ["feed", "social", "feature"],
    author: {
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
    },
    content: `
No todos entran al feed buscando lo mismo.

Algunos quieren descubrir builders nuevos. Otros quieren volver rápido a la gente que ya eligieron seguir.

Por eso sumamos una mejora que parece obvia, pero cambia mucho la experiencia: **ahora podés filtrar el feed entre \`Todos\` y \`Seguidos\`.**

## Dos modos, dos intenciones
### Todos
La vista **Todos** sirve para exploración.

Es donde ves actividad del ecosistema completo:

- nuevos proyectos
- movimientos en perfiles
- builders que empiezan a aparecer
- señales frescas de qué está pasando en la red

Es ideal si entrás con ganas de descubrir.

### Seguidos
La vista **Seguidos** es otra cosa.

Ahí el feed se vuelve más personal:

- seguís el progreso de gente que te interesa
- volvés a builders que ya te generaron confianza
- ves más rápido si alguien lanzó algo nuevo o actualizó su huevsite

Es ideal si entrás con intención de continuidad.

## Por qué importa este cambio
Un feed bueno no tiene que servir solo para “ver cosas”. Tiene que ayudarte a volver.

Cuando existe una capa de seguimiento real, huevsite deja de ser solamente una página que mostraste una vez y pasa a ser un lugar al que regresás porque hay movimiento que te importa.

## Mejor descubrimiento, mejor retención
La combinación funciona así:

- **Todos** mejora el descubrimiento.
- **Seguidos** mejora la profundidad y la recurrencia.

No compiten entre sí. Se complementan.

Primero encontrás builders interesantes. Después los seguís. Después tu feed se vuelve más valioso con el tiempo.

## Menos feed genérico, más contexto
La meta no es copiar una red social masiva.

La meta es que un builder entre a huevsite y en segundos pueda responder:

- qué se está moviendo en la comunidad
- qué lanzó la gente que sigo
- a quién vale la pena mirar más de cerca

**Con ese filtro, el feed deja de ser una lista plana y empieza a parecerse a una herramienta.**

¡A buildeaRRR!
    `,
  },
  {
    slug: "bio-block-y-avatar-una-sola-identidad-visual",
    title: "Bio block y avatar: una sola identidad visual para perfiles y sub-sites",
    excerpt: "Sincronizamos la imagen del bio block con el avatar real del perfil o sub-site. Si cambiás una, la otra se actualiza para evitar desfasajes y mantener una identidad visual consistente.",
    date: "2026-03-18",
    tags: ["perfil", "sub-sites", "update"],
    author: {
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
    },
    content: `
Había un problema chiquito, pero muy visible: a veces la imagen del **bio block** y el **avatar real** no coincidían.

Eso rompía algo importante: la sensación de identidad consistente.

Ahora lo corregimos.

## Qué pasa a partir de ahora
La imagen del bio block funciona como espejo del avatar del owner:

- en perfiles principales, del usuario
- en sub-sites, del sub-site correspondiente

Si actualizás una, la otra también se actualiza.

## Por qué importa
Puede parecer detalle visual, pero no lo es.

Cuando alguien entra a tu huevsite necesita entender rápido que todo pertenece al mismo sistema:

- la foto del perfil
- la cabecera
- la portada que aparece primero
- la imagen que ve cuando navega entre tus páginas

Si esas piezas se contradicen, baja la sensación de orden y profesionalismo.

## Menos desajustes manuales
Antes era posible que:

1. cambiaras la imagen desde editar perfil
2. el bio block quedara viejo
3. o editaras el bloque y el avatar no acompañara

Ahora esa lógica está unificada.

Eso significa:

- menos mantenimiento manual
- menos errores visuales
- menos perfiles “medio rotos” después de un cambio

## También aplica a sub-sites
Este punto era importante.

Los sub-sites ya no se sienten como páginas desconectadas: también respetan esa misma lógica visual. Si el sub-site tiene su propia imagen, el bloque principal acompaña. Si cambiás el bloque, el avatar del sub-site se alinea.

## Una mejora chica que ordena todo
Las mejores mejoras no siempre son las más ruidosas.

A veces son las que hacen que el producto se sienta más sólido, más coherente y menos frágil.

**Cuando el bio block y el avatar hablan el mismo idioma, toda la página se ve más cuidada.**

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
      name: "Equipo huevsite",
      username: "huevsite",
      avatarUrl: "/huevsite-avatar.png",
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

// ─── Supabase blog posts (Builder de la Semana + future dynamic posts) ────────

export async function getDBBlogPosts(): Promise<BlogPost[]> {
  // Hit Supabase REST directly instead of going through supabase-js. The
  // JS client's underlying fetch gets memoized by Next.js's data cache when
  // it runs inside a Server Component (e.g. /blog page), even with
  // `export const dynamic = "force-dynamic"` on the route — meaning newly
  // published BDLS posts wouldn't show up on the listing until the next
  // deploy. The same helper called from a Route Handler (/api/debug/blog)
  // bypassed the cache, which is how we caught it. Forcing
  // `cache: "no-store"` here closes the gap for both call sites.
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/blog_posts?select=*&is_published=eq.true&order=date.desc`;

  let rows: any[] = [];
  try {
    const res = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(
        `getDBBlogPosts: REST returned ${res.status} — ${await res.text().catch(() => "")}`
      );
      return [];
    }

    rows = (await res.json()) || [];
  } catch (e) {
    console.error("getDBBlogPosts fetch error:", e);
    return [];
  }

  return rows.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content,
    date: p.date,
    tags: p.tags ?? [],
    readingTime: calculateReadingTime(p.content || ""),
    author: {
      name: p.author_name,
      username: p.author_username,
      avatarUrl: p.author_avatar_url,
    },
  }));
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const dbPosts = await getDBBlogPosts();
  return [...BLOG_POSTS, ...dbPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export const BLOG_POSTS_PER_PAGE = 9;

// Canonical username we use to credit posts written by the platform itself
// (updates, launches, feature announcements) instead of an individual builder.
// No such profile exists in the DB, so links to this author go to the
// marketing homepage rather than 404ing on /huevsite.
export const PLATFORM_AUTHOR_USERNAME = "huevsite";

export function getBlogAuthorHref(author: BlogPost["author"]): string {
  if (author.username === PLATFORM_AUTHOR_USERNAME) return "/";
  return `/${author.username}`;
}

// A post is "Builder de la Semana" when it was generated from a builder_interview.
// The static posts don't have the tag, so we detect it by tags OR slug prefix.
export function isBuilderOfTheWeekPost(post: BlogPost): boolean {
  return (
    post.slug.startsWith("builder-de-la-semana-") ||
    post.tags.includes("builder-de-la-semana")
  );
}

export async function getPaginatedBlogPosts(opts: {
  page?: number;
  pageSize?: number;
  tag?: string;
}): Promise<{
  posts: BlogPost[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  allTags: string[];
}> {
  const pageSize = opts.pageSize ?? BLOG_POSTS_PER_PAGE;
  const page = Math.max(1, opts.page ?? 1);

  const all = await getAllBlogPosts();
  const filtered = opts.tag
    ? all.filter((p) => p.tags.includes(opts.tag!))
    : all;

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const posts = filtered.slice(start, start + pageSize);

  const allTags = Array.from(new Set(all.flatMap((p) => p.tags)));

  return { posts, total, totalPages, page: safePage, pageSize, allTags };
}

export async function getPostBySlugAsync(slug: string): Promise<BlogPost | undefined> {
  const hardcoded = getPostBySlug(slug);
  if (hardcoded) return hardcoded;

  // Same reason as getDBBlogPosts: bypass Next.js fetch memoization so newly
  // published posts are visible immediately, not only after the next deploy.
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/blog_posts?select=*&slug=ilike.${encodeURIComponent(slug)}&is_published=eq.true&limit=1`;

  let data: any = null;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return undefined;
    const rows = (await res.json()) || [];
    data = rows[0];
  } catch (e) {
    console.error("getPostBySlugAsync fetch error:", e);
    return undefined;
  }

  if (!data) return undefined;

  return {
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    date: data.date,
    tags: data.tags ?? [],
    readingTime: calculateReadingTime(data.content || ""),
    author: {
      name: data.author_name,
      username: data.author_username,
      avatarUrl: data.author_avatar_url,
    },
  };
}
