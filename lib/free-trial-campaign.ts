export const FREE_TRIAL_DAYS = 14;

export type FreeTrialTweetVariant =
  | "launch"
  | "insights"
  | "benefits"
  | "reminder"
  | "last_call";

export const FREE_TRIAL_TWEETS: Record<FreeTrialTweetVariant, string> = {
  launch: `Probá Huevsite Pro gratis por 14 días.\n\nDesbloqueás Insights, más bloques y más análisis de dominios y subsites.\n\nSi querés entender mejor qué pasa con tu perfil, este es el momento.\n\nClaim free trial en huevsite.io`,
  insights: `Lo más potente de Huevsite Pro no son solo más bloques.\n\nSon los Insights.\n\nVer qué está pasando con tu perfil y tomar mejores decisiones cambia todo.\n\nAhora podés probarlo gratis por 14 días en huevsite.io`,
  benefits: `Activamos una prueba gratis de 14 días de Huevsite Pro.\n\nEmpezá por Insights.\nDespués seguí con más bloques y análisis más profundos de dominios y subsites.\n\nProbalo y decidí si querés quedarte en Pro.`,
  reminder: `Tu perfil puede verse bien.\nPero con Insights entendés mejor qué está funcionando.\n\nHuevsite Pro ahora se puede probar gratis por 14 días.\n\nClaim free trial en huevsite.io`,
  last_call: `Si ya venís usando Huevsite y querías ver el valor real de Pro, este es el momento.\n\nInsights, más bloques y más análisis.\n\n14 días gratis para probarlo en serio.\n\nhuevsite.io`,
};

export type FreeTrialEmailStage =
  | "launch"
  | "welcome"
  | "activation"
  | "expiring"
  | "expired"
  | "last_chance";

export const FREE_TRIAL_EMAIL_COPY: Record<FreeTrialEmailStage, { subject: string; preview: string; title: string; body: string; cta: string; ctaHref: string; eyebrow?: string; }> = {
  launch: {
    subject: "Tu perfil tiene potencial — desbloquealo",
    preview: "14 días de Pro gratis para entender qué pasa con tu huevsite.",
    eyebrow: "Solo para vos",
    title: "Tu perfil tiene más potencial del que estás viendo",
    body: "Armaste tu huevsite, pero todavía no viste lo que pasa detrás. Con Pro podés abrir Insights y entender quién te visita, desde dónde y qué bloques funcionan mejor. También desbloqueás sub-sites, dominio custom y más bloques. Son 14 días gratis — sin tarjeta.",
    cta: "Activar mi prueba gratis",
    ctaHref: "https://huevsite.io/dashboard",
  },
  welcome: {
    subject: "Arrancó tu prueba Pro — empezá por acá",
    preview: "Tu primer paso: abrí Insights y mirá quién te visita.",
    eyebrow: "14 días de Pro",
    title: "Tu prueba Pro ya está activa",
    body: "Tenés 14 días para explorar todo lo que Pro tiene. Nuestro consejo: empezá por Insights. Ahí vas a ver las visitas a tu perfil, de dónde vienen, qué bloques captan más atención y cuánto engagement generás. Después probá agregar más bloques, sub-sites o conectar tu dominio.",
    cta: "Abrir mis Insights",
    ctaHref: "https://huevsite.io/dashboard?tab=insights",
  },
  activation: {
    subject: "Llevas 3 días de Pro y todavía no abriste Insights",
    preview: "Es lo que más valor te va a dar en estos 14 días.",
    eyebrow: "Día 3 de tu trial",
    title: "Lo mejor de Pro está en un solo click",
    body: "Ya pasaron 3 días de tu prueba y todavía no entraste a Insights. Ahí está la data real: quién mira tu perfil, desde qué ciudades, qué dispositivos usan y qué bloques les interesan más. No es solo un dashboard bonito — es información para tomar mejores decisiones sobre tu presencia online.",
    cta: "Ver mis Insights ahora",
    ctaHref: "https://huevsite.io/dashboard?tab=insights",
  },
  expiring: {
    subject: "Te quedan 2 días de Pro",
    preview: "Después de esto, Insights y sub-sites se bloquean.",
    eyebrow: "Tu trial termina pronto",
    title: "En 2 días perdés acceso a Insights",
    body: "Tu prueba gratis está por terminar. Cuando expire, los bloques que excedan el límite free se van a ocultar de tu perfil público, tus sub-sites dejan de ser visibles para otros y Insights se bloquea. Si Pro te sirvió, este es el momento de quedarte. Si no, no pasa nada — tu perfil sigue funcionando en el plan free.",
    cta: "Quedarme en Pro",
    ctaHref: "https://huevsite.io/dashboard",
  },
  expired: {
    subject: "Tu prueba terminó — te queda una última vista",
    preview: "Podés abrir Insights una última vez antes de que se bloquee.",
    eyebrow: "Trial finalizado",
    title: "Volviste al plan free",
    body: "Tu prueba de 14 días terminó. Ya estás en el plan gratuito — si tenías más de 5 bloques, te vamos a pedir que elijas cuáles mantener visibles. Pero antes de eso, te dejamos abrir Insights una última vez para que guardes lo que necesites. Después de esta vista, queda bloqueado.",
    cta: "Abrir mi última vista de Insights",
    ctaHref: "https://huevsite.io/dashboard?tab=insights",
  },
  last_chance: {
    subject: "¿Extrañás tus Insights?",
    preview: "Todo lo que construiste con Pro sigue ahí, esperándote.",
    eyebrow: "Volvé cuando quieras",
    title: "Tu data sigue acumulándose",
    body: "Aunque tu trial terminó, tu perfil sigue recibiendo visitas y nosotros seguimos trackeando todo. La diferencia es que ahora no podés verlo. Cuando quieras, podés volver a Pro y recuperar acceso a Insights, sub-sites, dominio custom y todos tus bloques. Nada se borró.",
    cta: "Reactivar Pro",
    ctaHref: "https://huevsite.io/dashboard",
  },
};
