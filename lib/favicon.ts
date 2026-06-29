// Resolve a crisp favicon URL for display. Scraped favicons are often a 16/32px
// `/favicon.ico`, which looks pixelated when rendered at 56–80px in the Builders
// Hunt card / project block. So: keep the scraped icon only when it's clearly
// high-res (apple-touch / sized PNG); otherwise serve a 128px icon from Google's
// favicon service derived from the project's domain (works for existing launches
// with no re-scrape). Falls back to whatever we have.
const HIRES = /(apple-touch|touch-icon|180x180|192x192|256x256|512x512|-180|-192|-256|-512)/i;

export function hiResFaviconUrl(link?: string | null, scraped?: string | null): string {
  if (scraped && HIRES.test(scraped)) return scraped;
  if (link) {
    try {
      const u = new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`);
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=128`;
    } catch {
      // fall through
    }
  }
  return scraped || "";
}
