import Link from "next/link";
import {
  CreditCard,
  Eye,
  LayoutGrid,
  MessageSquare,
  Plug,
  Rocket,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  CATEGORIES,
  getActivityStream,
  getPulse,
  type CategoryId,
  type EventCategory,
  type StreamEvent,
} from "@/lib/admin-activity";
import { AutoRefresh } from "@/components/admin/AutoRefresh";

export const dynamic = "force-dynamic";

const TZ = "America/Argentina/Buenos_Aires";
const clockFmt = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
const dayFmt = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
const fullFmt = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, dateStyle: "medium", timeStyle: "medium" });

const CATEGORY_META: Record<EventCategory, { label: string; icon: LucideIcon }> = {
  altas: { label: "Alta", icon: UserPlus },
  contenido: { label: "Contenido", icon: LayoutGrid },
  social: { label: "Social", icon: Users },
  lanzamientos: { label: "Lanzamiento", icon: Rocket },
  pagos: { label: "Pago", icon: CreditCard },
  mcp: { label: "MCP", icon: Plug },
  visitas: { label: "Visita", icon: Eye },
  feedback: { label: "Feedback", icon: MessageSquare },
};

type Search = { tipo?: string | string[]; u?: string | string[]; antes?: string | string[] };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function hrefFor(params: { tipo?: CategoryId; u?: string; antes?: string }): string {
  const query = new URLSearchParams();
  if (params.tipo && params.tipo !== "todo") query.set("tipo", params.tipo);
  if (params.u) query.set("u", params.u);
  if (params.antes) query.set("antes", params.antes);
  const text = query.toString();
  return text ? `/admin/actividad?${text}` : "/admin/actividad";
}

function dayLabel(key: string, todayKey: string, yesterdayKey: string, at: Date): string {
  if (key === todayKey) return "Hoy";
  if (key === yesterdayKey) return "Ayer";
  return dayFmt.format(at);
}

export default async function AdminActividadPage({ searchParams }: { searchParams?: Search }) {
  // El layout ya corta a quien no es admin; se repite acá porque esta página lee con service-role.
  await requireAdmin();

  const tipoParam = first(searchParams?.tipo);
  const tipo: CategoryId = CATEGORIES.some((category) => category.id === tipoParam) ? (tipoParam as CategoryId) : "todo";
  const uParam = first(searchParams?.u);
  const username = uParam && /^[a-zA-Z0-9_.-]{1,40}$/.test(uParam) ? uParam : undefined;
  const antesParam = first(searchParams?.antes);
  const antes = antesParam && !Number.isNaN(Date.parse(antesParam)) ? new Date(antesParam).toISOString() : undefined;

  const db = createServiceRoleClient();
  const now = new Date();
  const showPulse = !username && !antes;
  const [stream, pulse] = await Promise.all([
    getActivityStream(db, { category: tipo, username, before: antes }),
    showPulse ? getPulse(db, now) : Promise.resolve([]),
  ]);

  const todayKey = dayKeyFmt.format(now);
  const yesterdayKey = dayKeyFmt.format(new Date(now.getTime() - 24 * 3_600_000));
  const days: Array<{ key: string; label: string; events: StreamEvent[] }> = [];
  for (const event of stream.events) {
    const at = new Date(event.at);
    const key = dayKeyFmt.format(at);
    const last = days[days.length - 1];
    if (last && last.key === key) last.events.push(event);
    else days.push({ key, label: dayLabel(key, todayKey, yesterdayKey, at), events: [event] });
  }
  const oldest = stream.events[stream.events.length - 1];

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="section-label mb-1">// actividad</div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {username ? `Lo que hizo @${username}` : "Lo que va pasando"}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            {username ? (
              <>
                <Link href={`/${encodeURIComponent(username)}`} className="underline hover:text-white">
                  Ver su perfil
                </Link>
                {" · "}
                <Link href={hrefFor({ tipo })} className="underline hover:text-white">
                  Volver a todos
                </Link>
              </>
            ) : (
              "Altas, ediciones, pagos, visitas y llamadas al MCP en una sola línea de tiempo."
            )}
          </p>
        </div>
        {antes ? (
          <Link
            href={hrefFor({ tipo, u: username })}
            className="rounded-lg border border-[var(--border)] px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-[var(--text-dim)] hover:border-[var(--border-bright)] hover:text-white"
          >
            Volver a lo último
          </Link>
        ) : (
          <AutoRefresh seconds={30} />
        )}
      </header>

      {showPulse && (
        <section aria-label="Últimas 24 horas" className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          {pulse.map((metric) => {
            const Icon = CATEGORY_META[metric.category].icon;
            return (
              <Link
                key={metric.key}
                href={hrefFor({ tipo: metric.category })}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--border-bright)]"
              >
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  <Icon size={12} aria-hidden />
                  {metric.label}
                </div>
                <div className="mt-3 font-mono text-3xl font-bold tabular-nums text-white">
                  {metric.day ?? "—"}
                </div>
                <div className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">
                  en 24 h · {metric.week ?? "—"} en 7 días
                </div>
              </Link>
            );
          })}
        </section>
      )}

      <nav aria-label="Filtrar por tipo" className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const active = category.id === tipo;
          return (
            <Link
              key={category.id}
              href={hrefFor({ tipo: category.id, u: username })}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-bright)] hover:text-white"
              }`}
            >
              {category.label}
            </Link>
          );
        })}
      </nav>

      {stream.failed.length > 0 && (
        <p role="alert" className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          No se pudo leer: {stream.failed.join(", ")}. El resto de la línea de tiempo está completo.
        </p>
      )}

      {stream.unknownUser ? (
        <p className="py-16 text-center text-sm text-[var(--text-muted)]">No hay ningún builder con ese usuario.</p>
      ) : stream.events.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--text-muted)]">
          {stream.failed.length > 0 ? "No hay nada para mostrar." : "Todavía no pasó nada de este tipo."}
        </p>
      ) : (
        days.map((day) => (
          <section key={day.key} className="mb-8">
            <h2 className="sticky top-0 z-10 -mx-1 mb-1 bg-[var(--bg)] px-1 py-2 font-mono text-[11px] uppercase tracking-widest text-[var(--text-dim)]">
              {day.label} · {day.events.length}
            </h2>
            <ul>
              {day.events.map((event) => {
                const meta = CATEGORY_META[event.category];
                const Icon = meta.icon;
                const at = new Date(event.at);
                return (
                  <li
                    key={event.id}
                    className="flex flex-col gap-1 border-b border-[var(--border)] py-3 md:grid md:grid-cols-[3.25rem_8rem_1fr] md:items-baseline md:gap-4"
                  >
                    <div className="flex items-center gap-3 md:contents">
                      <time
                        dateTime={event.at}
                        title={fullFmt.format(at)}
                        className="font-mono text-xs tabular-nums text-[var(--text-muted)]"
                      >
                        {clockFmt.format(at)}
                      </time>
                      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                        <Icon size={12} aria-hidden className="translate-y-px" />
                        {meta.label}
                      </span>
                    </div>
                    <div className="min-w-0 text-sm">
                      {event.actor ? (
                        <Link
                          href={hrefFor({ u: event.actor })}
                          className="font-semibold text-white hover:text-[var(--accent)]"
                        >
                          @{event.actor}
                        </Link>
                      ) : (
                        <span className="text-[var(--text-muted)]">Alguien sin cuenta</span>
                      )}{" "}
                      <span className="break-words text-[var(--text-dim)]">{event.text}</span>
                      {event.count > 1 && (
                        <span className="ml-2 font-mono text-xs text-[var(--text-muted)]">{event.count} veces</span>
                      )}
                      {event.tone === "bad" && (
                        <span className="ml-2 rounded border border-red-500/50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-red-300">
                          Falló
                        </span>
                      )}
                      {event.tone === "warn" && (
                        <span className="ml-2 rounded border border-amber-500/50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-amber-200">
                          Ojo
                        </span>
                      )}
                      {event.detail && (
                        <div className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{event.detail}</div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      {stream.hasMore && oldest && (
        <div className="flex justify-center">
          <Link
            href={hrefFor({ tipo, u: username, antes: oldest.at })}
            className="rounded-lg border border-[var(--border)] px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-[var(--text-dim)] hover:border-[var(--border-bright)] hover:text-white"
          >
            Ver más atrás
          </Link>
        </div>
      )}
    </div>
  );
}
