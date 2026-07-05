// Shared-launch deep links (/feed?launch=<id>&week=<YYYY-Wxx>) circulate
// through chats and social apps that sometimes percent-encode the `&`
// (`launch=<uuid>%26week=...`), gluing everything into the launch param.
// Facebook was observed scraping exactly that variant, which a strict
// full-string UUID check rejects — and the preview silently fell back to the
// generic OG. So: extract the UUID (and, if needed, the week) from wherever
// they landed instead of trusting the param split.
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const WEEK_RE = /\d{4}-W\d{2}/;

export function parseLaunchShareParams(
  launchRaw: string | null | undefined,
  weekRaw: string | null | undefined
): { launchId: string | null; week: string | null } {
  const launchId = launchRaw?.match(UUID_RE)?.[0]?.toLowerCase() || null;
  const week = weekRaw?.match(WEEK_RE)?.[0] || launchRaw?.match(WEEK_RE)?.[0] || null;
  return { launchId, week };
}
