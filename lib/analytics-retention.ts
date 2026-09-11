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
 */
export async function pruneAnalytics(retentionDays = RETENTION_DAYS): Promise<PruneResult> {
  const supabase = createServiceRoleClient();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const deleted: PruneResult = {};

  for (const { table, column } of TABLES) {
    let total = 0;

    for (let i = 0; i < MAX_BATCHES; i++) {
      const { data: rows, error: selErr } = await supabase
        .from(table)
        .select("id")
        .lt(column, cutoff)
        .limit(BATCH);

      if (selErr) {
        console.error(`[analytics-retention] select ${table}:`, selErr.message);
        break;
      }
      if (!rows || rows.length === 0) break;

      const { error: delErr } = await supabase
        .from(table)
        .delete()
        .in("id", rows.map((r: { id: string }) => r.id));

      if (delErr) {
        console.error(`[analytics-retention] delete ${table}:`, delErr.message);
        break;
      }

      total += rows.length;
      if (rows.length < BATCH) break;
    }

    deleted[table] = total;
  }

  return deleted;
}
