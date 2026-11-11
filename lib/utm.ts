import { safeHref } from "@/lib/safe-url";

// Append huevsite UTM params to an outbound user link so the user's own
// analytics (GA, Plausible, etc.) attribute the traffic to huevsite.
// Idempotent: never clobbers UTM params the URL already has.
export function withHuevsiteUtm(url: string, medium: "feed" | "profile"): string {
  if (!url) return url;
  try {
    const u = new URL(url);
    // mailto:, tel: y similares pasan tal cual; javascript:/data: nunca llegan al href.
    if (u.protocol !== "http:" && u.protocol !== "https:") return safeHref(url);
    if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", "huevsite");
    if (!u.searchParams.has("utm_medium")) u.searchParams.set("utm_medium", medium);
    if (!u.searchParams.has("utm_campaign")) u.searchParams.set("utm_campaign", "launch");
    return u.toString();
  } catch {
    return safeHref(url);
  }
}
