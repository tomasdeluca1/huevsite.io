// Lectura para /admin/actividad: junta en una sola línea de tiempo lo que va pasando en huevsite.
// Usa el cliente service-role, así que sólo se llama después de requireAdmin().
import type { SupabaseClient } from "@supabase/supabase-js";

export const CATEGORIES = [
  { id: "todo", label: "Todo" },
  { id: "altas", label: "Altas" },
  { id: "contenido", label: "Contenido" },
  { id: "social", label: "Social" },
  { id: "lanzamientos", label: "Lanzamientos" },
  { id: "pagos", label: "Pagos" },
  { id: "mcp", label: "MCP" },
  { id: "visitas", label: "Visitas" },
  { id: "feedback", label: "Feedback" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export type EventCategory = Exclude<CategoryId, "todo">;
export type Tone = "bad" | "warn";

export type StreamEvent = {
  id: string;
  at: string;
  category: EventCategory;
  /** Username del que hizo la acción, si tiene perfil. */
  actor: string | null;
  text: string;
  detail?: string;
  tone?: Tone;
  /** Cuántas veces seguidas pasó lo mismo (ediciones en ráfaga). */
  count: number;
};

export type ActivityStream = {
  events: StreamEvent[];
  /** Fuentes que no se pudieron leer. */
  failed: string[];
  /** Hay más historia para atrás de lo que se muestra. */
  hasMore: boolean;
  unknownUser: boolean;
};

export type PulseMetric = {
  key: string;
  label: string;
  category: EventCategory;
  day: number | null;
  week: number | null;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;
type Context = {
  who: (id: string | null | undefined) => string | null;
  block: (id: string | null | undefined) => string | null;
  client: (id: string | null | undefined) => string | null;
};

type Draft = {
  id: string;
  at: string;
  category: EventCategory;
  userId: string | null;
  profileIds?: string[];
  blockId?: string;
  clientId?: string;
  text: string | ((ctx: Context) => string);
  detail?: string;
  tone?: Tone;
};

type Source = {
  key: string;
  label: string;
  table: string;
  columns: string;
  tsCol: string;
  userCol: string;
  categories: EventCategory[];
  limit: number;
  refine?: (query: any, category: EventCategory | null) => any;
  toDraft: (row: Row) => Omit<Draft, "id" | "at"> | null;
};

const ACTIVITY_CATEGORY: Record<string, EventCategory> = {
  new_block: "contenido",
  block_update: "contenido",
  profile_update: "contenido",
  new_follow: "social",
  new_endorsement: "social",
  new_nomination: "social",
  pro_upgrade: "pagos",
  founder_gift: "pagos",
  founder_refund: "pagos",
  launch_boost: "pagos",
};

const SOCIAL_TYPES = ["new_follow", "new_endorsement", "new_nomination"];
const PAYMENT_TYPES = ["pro_upgrade", "launch_boost"];

function typesFor(category: EventCategory): string[] {
  return Object.keys(ACTIVITY_CATEGORY).filter((type) => ACTIVITY_CATEGORY[type] === category);
}

function clip(value: unknown, max: number): string {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function join(parts: Array<string | null | undefined | false>): string | undefined {
  const kept = parts.filter((part): part is string => typeof part === "string" && part.length > 0);
  return kept.length ? kept.join(" · ") : undefined;
}

function host(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function activityDraft(row: Row): Omit<Draft, "id" | "at"> | null {
  const data: Row = row.data && typeof row.data === "object" ? row.data : {};
  const base = { userId: row.user_id as string, category: ACTIVITY_CATEGORY[row.type] ?? ("contenido" as EventCategory) };
  const target = typeof data.targetUsername === "string" ? `@${data.targetUsername}` : "alguien";
  switch (row.type) {
    case "new_block":
      return { ...base, text: `sumó un bloque ${clip(data.blockType, 30) || "nuevo"}` };
    case "block_update":
      return { ...base, text: `editó un bloque ${clip(data.blockType, 30)}`.trim() };
    case "profile_update":
      return {
        ...base,
        text: "editó su perfil",
        detail: Array.isArray(data.updatedFields) ? clip(data.updatedFields.join(", "), 120) : undefined,
      };
    case "new_follow":
      return { ...base, text: `empezó a seguir a ${target}` };
    case "new_endorsement":
      return { ...base, text: `recomendó a ${target}`, detail: clip(data.skill, 60) || undefined };
    case "new_nomination":
      return { ...base, text: `nominó a ${target} al showcase` };
    case "pro_upgrade":
      return {
        ...base,
        text: data.lifetime ? "compró Founder (de por vida)" : "pasó a Pro",
        detail: clip(data.event, 60) || undefined,
      };
    case "founder_gift":
      return { ...base, text: "recibió Founder de regalo" };
    case "founder_refund":
      return { ...base, text: "pidió el reembolso de Founder", tone: "warn" };
    case "launch_boost":
      return { ...base, text: "pagó un boost de lanzamiento" };
    default:
      return { ...base, text: clip(row.type, 40) };
  }
}

const SOURCES: Source[] = [
  {
    key: "profiles",
    label: "altas",
    table: "profiles",
    columns: "id, country, subscription_tier, created_at",
    tsCol: "created_at",
    userCol: "id",
    categories: ["altas"],
    limit: 40,
    toDraft: (row) => ({
      userId: row.id,
      category: "altas",
      text: "se registró",
      detail: join([row.country, row.subscription_tier && row.subscription_tier !== "free" ? row.subscription_tier : null]),
    }),
  },
  {
    key: "activities",
    label: "actividad de la app",
    table: "activities",
    columns: "id, user_id, type, data, created_at",
    tsCol: "created_at",
    userCol: "user_id",
    categories: ["contenido", "social", "pagos"],
    limit: 120,
    // El alta ya sale de profiles; acá sería un duplicado.
    refine: (query, category) => (category ? query.in("type", typesFor(category)) : query.neq("type", "new_builder")),
    toDraft: activityDraft,
  },
  {
    key: "sub_sites",
    label: "sub-sitios",
    table: "sub_sites",
    columns: "id, user_id, slug, title, created_at",
    tsCol: "created_at",
    userCol: "user_id",
    categories: ["contenido"],
    limit: 20,
    toDraft: (row) => ({
      userId: row.user_id,
      category: "contenido",
      text: `creó el sub-sitio /${clip(row.slug, 40)}`,
      detail: clip(row.title, 80) || undefined,
    }),
  },
  {
    key: "project_launches",
    label: "lanzamientos",
    table: "project_launches",
    columns: "id, block_id, user_id, launch_week, featured, scheduled, launched_at",
    tsCol: "launched_at",
    userCol: "user_id",
    categories: ["lanzamientos"],
    limit: 30,
    toDraft: (row) => ({
      userId: row.user_id,
      category: "lanzamientos",
      blockId: row.block_id,
      text: (ctx) => `lanzó ${ctx.block(row.block_id) ?? "un proyecto"}`,
      detail: join([row.launch_week, row.featured && "destacado", row.scheduled && "programado"]),
    }),
  },
  {
    key: "project_upvotes",
    label: "votos",
    table: "project_upvotes",
    columns: "id, voter_id, created_at",
    tsCol: "created_at",
    userCol: "voter_id",
    categories: ["social"],
    limit: 40,
    toDraft: (row) => ({ userId: row.voter_id, category: "social", text: "votó un lanzamiento" }),
  },
  {
    key: "lemon_purchases",
    label: "pagos de Lemon",
    table: "lemon_purchases",
    columns: "id, user_id, event_name, status, utm_source, created_at",
    tsCol: "created_at",
    userCol: "user_id",
    categories: ["pagos"],
    limit: 30,
    toDraft: (row) => ({
      userId: row.user_id ?? null,
      category: "pagos",
      text: `Lemon: ${clip(row.event_name, 60)}`,
      detail: join([row.status, row.utm_source && `vino de ${clip(row.utm_source, 40)}`]),
      tone: /refund|cancel|expired|failed/i.test(String(row.event_name)) ? "warn" : undefined,
    }),
  },
  {
    key: "mcp_audit_log",
    label: "llamadas al MCP",
    table: "mcp_audit_log",
    columns: "id, user_id, tool, ok, error_code, meta, created_at",
    tsCol: "created_at",
    userCol: "user_id",
    categories: ["mcp"],
    limit: 60,
    toDraft: (row) => {
      // "rate_limit" no es un tool: es la marca que deja lib/mcp/http.ts cuando frena a alguien.
      if (row.tool === "rate_limit") {
        return { userId: row.user_id, category: "mcp", text: "chocó con el tope de pedidos del MCP", tone: "warn" };
      }
      return {
        userId: row.user_id,
        category: "mcp",
        text: `usó ${clip(row.tool, 64)} por MCP`,
        detail: join([row.meta?.dry_run === true && "prueba sin guardar", !row.ok && `falló: ${clip(row.error_code, 40) || "error"}`]),
        tone: row.ok ? undefined : "bad",
      };
    },
  },
  {
    key: "oauth_authorization_codes",
    label: "apps conectadas",
    table: "oauth_authorization_codes",
    columns: "id, client_id, user_id, redirect_uri, used_at, created_at",
    tsCol: "created_at",
    userCol: "user_id",
    categories: ["mcp"],
    limit: 30,
    toDraft: (row) => ({
      userId: row.user_id,
      category: "mcp",
      clientId: row.client_id,
      text: (ctx) => {
        const name = ctx.client(row.client_id) ?? "una app";
        return row.used_at ? `conectó ${name} a su huevsite` : `le dio permiso a ${name}, que no lo usó`;
      },
      detail: join([host(row.redirect_uri) && `entrega en ${host(row.redirect_uri)}`]),
      tone: row.used_at ? undefined : "warn",
    }),
  },
  {
    key: "profile_visitors",
    label: "visitas",
    table: "profile_visitors",
    columns: "id, profile_id, visitor_user_id, country, city, referrer, device, created_at",
    tsCol: "created_at",
    userCol: "profile_id",
    categories: ["visitas"],
    limit: 50,
    toDraft: (row) => ({
      userId: row.visitor_user_id ?? null,
      category: "visitas",
      profileIds: [row.profile_id],
      text: (ctx) => `visitó ${ctx.who(row.profile_id) ? `@${ctx.who(row.profile_id)}` : "un perfil"}`,
      detail: join([
        [row.city, row.country].filter(Boolean).join(", ") || null,
        host(row.referrer) && `desde ${host(row.referrer)}`,
        clip(row.device, 20) || null,
      ]),
    }),
  },
  {
    key: "feedbacks",
    label: "feedback",
    table: "feedbacks",
    columns: "id, user_id, content, category, created_at",
    tsCol: "created_at",
    userCol: "user_id",
    categories: ["feedback"],
    limit: 20,
    toDraft: (row) => ({
      userId: row.user_id ?? null,
      category: "feedback",
      text: `dejó feedback: "${clip(row.content, 160)}"`,
      detail: clip(row.category, 30) || undefined,
    }),
  },
];

const FOCUSED_LIMIT = 200;
const BURST_MS = 10 * 60_000;

async function lookup(
  db: SupabaseClient,
  table: string,
  idCol: string,
  columns: string,
  ids: string[],
  pick: (row: Row) => string | null
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = Array.from(new Set(ids.filter(Boolean)));
  for (let i = 0; i < unique.length; i += 200) {
    const { data, error } = await db.from(table).select(columns).in(idCol, unique.slice(i, i + 200));
    if (error) {
      console.error("[admin-activity] lookup", table, error.message);
      continue;
    }
    for (const row of (data ?? []) as Row[]) {
      const value = pick(row);
      if (value) map.set(String(row[idCol]), value);
    }
  }
  return map;
}

export async function getActivityStream(
  db: SupabaseClient,
  input: { category: CategoryId; username?: string; before?: string }
): Promise<ActivityStream> {
  let userId: string | null = null;
  if (input.username) {
    const { data } = await db.from("profiles").select("id").eq("username", input.username).maybeSingle();
    if (!data) return { events: [], failed: [], hasMore: false, unknownUser: true };
    userId = data.id as string;
  }

  const category = input.category === "todo" ? null : input.category;
  const sources = SOURCES.filter((source) => !category || source.categories.includes(category));
  const focused = sources.length === 1 || Boolean(userId);

  const results = await Promise.all(
    sources.map(async (source) => {
      const limit = focused ? FOCUSED_LIMIT : source.limit;
      let query: any = db.from(source.table).select(source.columns);
      if (userId) query = query.eq(source.userCol, userId);
      if (input.before) query = query.lt(source.tsCol, input.before);
      if (source.refine) query = source.refine(query, category);
      const { data, error } = await query.order(source.tsCol, { ascending: false }).limit(limit);
      if (error) {
        console.error("[admin-activity]", source.key, error.message);
        return { source, rows: [] as Row[], failed: true, full: false };
      }
      const rows = ((data ?? []) as Row[]).filter((row) => row[source.tsCol]);
      return { source, rows, failed: false, full: rows.length >= limit };
    })
  );

  // Una fuente que llenó su cupo tiene más historia de la que trajo: por debajo de su fila más
  // vieja la línea de tiempo quedaría con huecos, así que se corta ahí.
  let cutoff = 0;
  for (const result of results) {
    if (!result.full) continue;
    const oldest = Date.parse(result.rows[result.rows.length - 1][result.source.tsCol]);
    if (oldest > cutoff) cutoff = oldest;
  }

  const drafts: Draft[] = [];
  for (const { source, rows } of results) {
    for (const row of rows) {
      const at = new Date(row[source.tsCol]).toISOString();
      if (Date.parse(at) < cutoff) continue;
      const draft = source.toDraft(row);
      if (!draft) continue;
      if (category && draft.category !== category) continue;
      drafts.push({ ...draft, id: `${source.key}:${row.id}`, at });
    }
  }
  drafts.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  const [profiles, blocks, clients] = await Promise.all([
    lookup(
      db,
      "profiles",
      "id",
      "id, username",
      drafts.flatMap((draft) => [draft.userId ?? "", ...(draft.profileIds ?? [])]),
      (row) => row.username ?? null
    ),
    lookup(
      db,
      "blocks",
      "id",
      "id, title:data->>title, name:data->>name",
      drafts.map((draft) => draft.blockId ?? ""),
      (row) => clip(row.title || row.name, 60) || null
    ),
    lookup(
      db,
      "oauth_clients",
      "client_id",
      "client_id, client_name",
      drafts.map((draft) => draft.clientId ?? ""),
      (row) => clip(row.client_name, 60) || null
    ),
  ]);
  const ctx: Context = {
    who: (id) => (id ? profiles.get(id) ?? null : null),
    block: (id) => (id ? blocks.get(id) ?? null : null),
    client: (id) => (id ? clients.get(id) ?? null : null),
  };

  const events: StreamEvent[] = [];
  for (const draft of drafts) {
    const text = typeof draft.text === "function" ? draft.text(ctx) : draft.text;
    const actor = ctx.who(draft.userId);
    const previous = events[events.length - 1];
    if (
      previous &&
      actor &&
      previous.actor === actor &&
      previous.text === text &&
      previous.category === draft.category &&
      previous.tone === draft.tone &&
      Date.parse(previous.at) - Date.parse(draft.at) < BURST_MS
    ) {
      previous.count += 1;
      continue;
    }
    events.push({ id: draft.id, at: draft.at, category: draft.category, actor, text, detail: draft.detail, tone: draft.tone, count: 1 });
  }

  return {
    events,
    failed: results.filter((result) => result.failed).map((result) => result.source.label),
    hasMore: cutoff > 0,
    unknownUser: false,
  };
}

const PULSE: Array<{ key: string; label: string; category: EventCategory; table: string; types?: string[] }> = [
  { key: "altas", label: "Altas", category: "altas", table: "profiles" },
  { key: "bloques", label: "Bloques nuevos", category: "contenido", table: "blocks" },
  { key: "visitas", label: "Visitas a perfiles", category: "visitas", table: "profile_visitors" },
  { key: "mcp", label: "Llamadas al MCP", category: "mcp", table: "mcp_audit_log" },
  { key: "social", label: "Follows y recomendaciones", category: "social", table: "activities", types: SOCIAL_TYPES },
  { key: "pagos", label: "Pagos", category: "pagos", table: "activities", types: PAYMENT_TYPES },
];

export async function getPulse(db: SupabaseClient, now: Date): Promise<PulseMetric[]> {
  const count = async (metric: (typeof PULSE)[number], sinceMs: number): Promise<number | null> => {
    let query: any = db
      .from(metric.table)
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(now.getTime() - sinceMs).toISOString());
    if (metric.types) query = query.in("type", metric.types);
    const { count: total, error } = await query;
    if (error) {
      console.error("[admin-activity] pulse", metric.key, error.message);
      return null;
    }
    return total ?? 0;
  };
  return Promise.all(
    PULSE.map(async (metric) => {
      const [day, week] = await Promise.all([count(metric, 24 * 3_600_000), count(metric, 7 * 24 * 3_600_000)]);
      return { key: metric.key, label: metric.label, category: metric.category, day, week };
    })
  );
}
