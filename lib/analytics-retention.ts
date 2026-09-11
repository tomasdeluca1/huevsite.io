import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Retención de telemetría.
 *
 * analytics_events y profile_visitors crecían sin techo: llegaron a 322k y
 * 320k filas contra 312 perfiles y 1.104 bloques, y ese peso —no el tráfico
 * de producto— fue lo que agotó el Disk IO Budget de Supabase en 2026-09.
 *
 * El UI de insights (DATE_FILTERS en components/dashboard/InsightsTab.tsx)
 * ofrece como máximo 3M, así que nada más viejo que 90 días es visible desde
 * el producto. Si algún día se agrega un rango más largo, hay que subir
 * RETENTION_DAYS antes o el rango nuevo va a venir vacío.
 */
export const RETENTION_DAYS = 90;

const BATCH = 5_000;
const MAX_BATCHES = 40; // techo por corrida: 200k filas por tabla

const TABLES = [
  { table: "analytics_events", column: "created_at" },
  { table: "profile_visitors", column: "created_at" },
] as const;

export type PruneResult = Record<string, number>;

/**
 * Borra en batches acotados para no clavar un DELETE gigante sobre una base
 * que ya está corta de IO. Después de la purga inicial
 * (20260911000000_analytics_disk_io.sql) cada corrida semanal toca unas pocas
 * miles de filas.
 *
 * Cada batch se acota por rango de fecha, NO por lista de ids: PostgREST manda
 * los filtros en la URL, y un `id=in.(...)` con 5.000 UUIDs son ~185KB de
 * query string que el servidor rechaza antes de contestar. Así que en vez de
 * juntar ids, se busca el created_at de la fila que está en el offset BATCH y
 * se borra todo lo anterior: un solo filtro corto, y el índice
 * idx_*_created_at resuelve tanto el offset como el DELETE.
 */
export async function pruneAnalytics(retentionDays = RETENTION_DAYS): Promise<PruneResult> {
  const supabase = createServiceRoleClient();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const deleted: PruneResult = {};

  for (const { table, column } of TABLES) {
    let total = 0;

    for (let i = 0; i < MAX_BATCHES; i++) {
      // Fila BATCH-ésima más vieja por debajo del cutoff. Si no existe, lo que
      // queda entra entero en este último batch.
      const { data: edge, error: edgeErr } = await supabase
        .from(table)
        .select(column)
        .lt(column, cutoff)
        .order(column, { ascending: true })
        .range(BATCH, BATCH)
        .maybeSingle();

      if (edgeErr) {
        console.error(`[analytics-retention] edge ${table}:`, edgeErr.message);
        break;
      }

      const upTo = (edge as Record<string, string> | null)?.[column] ?? cutoff;

      const { count, error: delErr } = await supabase
        .from(table)
        .delete({ count: "exact" })
        .lt(column, upTo);

      if (delErr) {
        console.error(`[analytics-retention] delete ${table}:`, delErr.message);
        break;
      }

      total += count ?? 0;

      // Sin edge ya se barrió todo. Con edge pero sin filas borradas, todas
      // comparten el mismo created_at y otro batch no avanzaría.
      if (!edge || !count) break;
    }

    deleted[table] = total;
  }

  return deleted;
}
