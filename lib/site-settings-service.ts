import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type SiteSettings = Record<string, string>;

function isMissingTable(error: any) {
  return (
    error &&
    (error.code === "42P01" ||
      error.code === "PGRST205" ||
      /relation .* does not exist|could not find the table/i.test(error.message || ""))
  );
}

// All settings as a flat key→value map. Degrades to {} if unmigrated.
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const svc = createServiceRoleClient();
    const { data, error } = await svc.from("site_settings").select("key, value");
    if (error) {
      if (!isMissingTable(error)) console.error("getSiteSettings:", error);
      return {};
    }
    const out: SiteSettings = {};
    for (const row of data || []) {
      if (row.key && typeof row.value === "string") out[row.key] = row.value;
    }
    return out;
  } catch (e) {
    console.error("getSiteSettings exception:", e);
    return {};
  }
}

// Loom/YouTube share URLs → embeddable URL. Direct files (mp4/webm) return null
// (caller renders a <video> instead). Anything else is returned as-is (iframe).
export function toEmbedUrl(raw: string): { embed: string | null; file: string | null } {
  const url = (raw || "").trim();
  if (!url) return { embed: null, file: null };
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(url)) return { embed: null, file: url };

  const loom = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (loom) return { embed: `https://www.loom.com/embed/${loom[1]}`, file: null };

  const yt =
    url.match(/youtube\.com\/watch\?v=([\w-]+)/) ||
    url.match(/youtu\.be\/([\w-]+)/) ||
    url.match(/youtube\.com\/embed\/([\w-]+)/);
  if (yt) return { embed: `https://www.youtube.com/embed/${yt[1]}`, file: null };

  return { embed: url, file: null };
}
