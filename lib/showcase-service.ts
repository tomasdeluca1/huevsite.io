import { createClient } from "@supabase/supabase-js";

// Showcase reads aggregated nomination + winner data for the public
// /showcase page. Since 2026-04-11 the showcase_nominations table is no
// longer directly readable by anon/authenticated (privacy: reveals who
// voted for whom). We use the service-role client here so the API layer
// can sanitize and aggregate before returning to the page.
function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export function getWeekString(date: Date): string {
  // Ajuste a horario de Argentina (UTC-3)
  const argTime = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  const d = new Date(Date.UTC(argTime.getUTCFullYear(), argTime.getUTCMonth(), argTime.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getCurrentWeek(): string {
  return getWeekString(new Date());
}

function normalizeSubSites(subSites: any[] = []) {
  return subSites.map((site: any) => ({
    ...site,
    avatarUrl: site.avatarUrl || site.avatar_url || "",
    sourceUrl: site.sourceUrl || site.source_url || "",
  }));
}

export async function getShowcaseData(requestedWeek?: string | null) {
  const currentWeek = requestedWeek || getCurrentWeek();

  try {
    const supabase = getServiceRoleClient();

    // Winner: Intentar buscar por week específica, si no, traer la week del más reciente
    let targetWeek = requestedWeek;

    if (!targetWeek) {
      const { data: latestWinner } = await supabase
        .from("showcase_winners")
        .select("week")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (latestWinner) {
        targetWeek = latestWinner.week;
      }
    }

    let winners: any[] = [];
    if (targetWeek) {
      const { data: winnerData, error: winnerError } = await supabase
        .from("showcase_winners")
        .select(`
          week,
          user:profiles!showcase_winners_user_id_fkey (
            id, username, name, image, accent_color, tagline,
            blocks:blocks (*),
            sub_sites:sub_sites (*)
          )
        `)
        .eq("week", targetWeek);

      if (winnerError) {
        console.error("Winner query error:", winnerError);
      } else if (winnerData) {
        // Parse blocks to exclude sub-site blocks for the main profile view
        winners = winnerData.map((w: any) => {
          if (w.user && w.user.blocks) {
            w.user.blocks = w.user.blocks.filter((b: any) => b.sub_site_id === null);
          }
          if (w.user?.sub_sites) {
            w.user.sub_sites = normalizeSubSites(w.user.sub_sites);
          }
          return w;
        });
      }
    }

    // Top 5 nominados de la semana ACTUAL
    const { data: nominations, error: nomError } = await supabase
      .from("showcase_nominations")
      .select(`
        user_id,
        user:profiles!showcase_nominations_user_id_fkey (
          id, username, name, image, accent_color
        )
      `)
      .eq("week", currentWeek);

    if (nomError) {
      console.error("Nominations query error:", nomError);
    }

    // Contar nominaciones por usuario
    const counts = (nominations ?? []).reduce<Record<string, { count: number; user: any }>>((acc, n: any) => {
      if (!acc[n.user_id]) acc[n.user_id] = { count: 0, user: n.user };
      acc[n.user_id].count++;
      return acc;
    }, {});

    const finalists = Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([userId, data]) => ({ userId, count: data.count, user: data.user }));

    const { data: randomData } = await supabase
      .from("profiles")
      .select(`
        id, username, name, image, accent_color, tagline,
        blocks:blocks (*),
        sub_sites:sub_sites (*)
      `)
      .gte("builder_score", 300)
      .order("builder_score", { ascending: false })
      .limit(50);

    let randoms: any[] = [];
    if (randomData) {
      const parsedProfiles = randomData.map((p: any) => {
        if (p.blocks) {
          p.blocks = p.blocks.filter((b: any) => b.sub_site_id === null);
        }
        if (p.sub_sites) {
          p.sub_sites = normalizeSubSites(p.sub_sites);
        }
        return p;
      });
      const GENERIC_BUILDING = ["proyecto sin nombre", "tu proyecto", "mi primer proyecto", ""];
      const GENERIC_PROJECT  = ["proyecto", "mi proyecto", ""];

      const validProfiles = parsedProfiles.filter((p: any) => {
        if (!p.blocks || p.blocks.length === 0) return false;

        const buildingBlocks = p.blocks.filter((b: any) => b.type === "building" && b.visible);
        const projectBlocks  = p.blocks.filter((b: any) => b.type === "project"  && b.visible);

        // Si tiene building blocks, al menos uno debe tener nombre real
        if (buildingBlocks.length > 0) {
          const hasRealBuilding = buildingBlocks.some((b: any) => {
            const project = (b.project || b.data?.project || "").trim().toLowerCase();
            return project && !GENERIC_BUILDING.includes(project);
          });
          if (!hasRealBuilding) return false;
        }

        // Si tiene project blocks, al menos uno debe tener título real
        if (projectBlocks.length > 0) {
          const hasRealProject = projectBlocks.some((b: any) => {
            const title = (b.title || b.data?.title || "").trim().toLowerCase();
            return title && !GENERIC_PROJECT.includes(title);
          });
          if (!hasRealProject) return false;
        }

        return true;
      });
      randoms = validProfiles.sort(() => 0.5 - Math.random()).slice(0, 7);
    }

    const { count: totalBuilders } = await supabase
      .from("profiles")
      .select('*', { count: 'exact', head: true });

    return { 
      week: currentWeek, 
      winners: winners, 
      finalists,
      randoms,
      total_builders: totalBuilders || 0
    };
  } catch (error) {
    console.error("Showcase service error:", error);
    return { week: currentWeek, winners: [], finalists: [], randoms: [] };
  }
}
