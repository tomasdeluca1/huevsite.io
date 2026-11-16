import { unstable_cache } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { COMMUNITY_IMAGE_EXCLUDED } from "@/lib/community-exclusions";

export type WallBuilder = {
  username: string;
  name: string;
  image: string;
  tagline: string;
  score: number;
  projects: number;
  active: boolean;
  /** Fue Builder de la Semana alguna vez: va en el anillo de adentro. */
  winner: boolean;
};

export type CommunityWall = { total: number; builders: WallBuilder[] };

const PAGE = 1000;

// PostgREST corta en 1000 filas: se pide de a páginas hasta que no venga más.
async function allRows<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < 50_000; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error || !data) break;
    out.push(...data);
    if (data.length < PAGE) break;
  }
  return out;
}

// Foto chica y en webp por el proxy: el muro carga cientos de caras.
function wallImage(src: string): string {
  return `https://images.weserv.nl/?url=${encodeURIComponent(src)}&w=128&h=128&fit=cover&output=webp`;
}

async function load(): Promise<CommunityWall> {
  const supabase = createServiceRoleClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [countRes, profiles, recent, projects, winners] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).not("username", "is", null),
    allRows<{ id: string; username: string; name: string | null; image: string | null; tagline: string | null; builder_score: number | null }>((from, to) =>
      supabase.from("profiles").select("id, username, name, image, tagline, builder_score").not("username", "is", null).not("image", "is", null).range(from, to)
    ),
    allRows<{ user_id: string }>((from, to) => supabase.from("blocks").select("user_id").gte("updated_at", since).range(from, to)),
    allRows<{ user_id: string }>((from, to) =>
      supabase.from("blocks").select("user_id").eq("type", "project").eq("visible", true).is("sub_site_id", null).range(from, to)
    ),
    allRows<{ user_id: string }>((from, to) => supabase.from("showcase_winners").select("user_id").range(from, to)),
  ]);
  const winnerIds = new Set(winners.map((w) => w.user_id));

  const activity = new Map<string, number>();
  for (const r of recent) activity.set(r.user_id, (activity.get(r.user_id) ?? 0) + 1);
  const projectCount = new Map<string, number>();
  for (const r of projects) projectCount.set(r.user_id, (projectCount.get(r.user_id) ?? 0) + 1);

  const builders = profiles
    .filter((p) => p.image && /^https?:\/\//i.test(p.image) && !COMMUNITY_IMAGE_EXCLUDED.has(p.username.toLowerCase()))
    // Primero los Builders de la Semana (anillo de adentro), después por actividad.
    .sort((a, b) =>
      Number(winnerIds.has(b.id)) - Number(winnerIds.has(a.id)) ||
      (activity.get(b.id) ?? 0) - (activity.get(a.id) ?? 0) ||
      (b.builder_score ?? 0) - (a.builder_score ?? 0)
    )
    .map((p) => ({
      username: p.username,
      name: p.name || p.username,
      image: wallImage(p.image as string),
      tagline: (p.tagline || "").slice(0, 120),
      score: p.builder_score ?? 0,
      projects: projectCount.get(p.id) ?? 0,
      active: activity.has(p.id),
      winner: winnerIds.has(p.id),
    }));

  return { total: countRes.count ?? builders.length, builders };
}

/** El muro de la home: todos los perfiles con foto, los más activos primero. Cacheado 1 hora. */
export const getCommunityWall = unstable_cache(
  async (): Promise<CommunityWall> => {
    try {
      return await load();
    } catch {
      return { total: 0, builders: [] };
    }
  },
  ["community-wall-v2"],
  { revalidate: 3600 }
);
