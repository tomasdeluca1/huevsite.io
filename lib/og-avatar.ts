// Satori (the engine behind `next/og`'s ImageResponse on the edge) cannot
// decode WebP/AVIF. huevsite stores uploaded avatars as WebP, so embedding one
// directly via `<img src={avatarUrl}>` makes ImageResponse throw
// ("Image size cannot be determined. Please provide the width and height of the
// image.") and the OG route returns HTTP 500 — social crawlers then report the
// OG image URL as invalid/unreachable.
//
// Route remote avatars through a free image proxy that re-encodes to JPEG at a
// fixed size, which Satori renders fine. This mirrors `safeAvatarUrl` in
// app/opengraph-image.tsx (the showcase OG image), which already does this.
//
// Returns null for missing/non-http sources so callers fall back to a
// placeholder instead of handing an undecodable image to Satori.
export function ogAvatarUrl(src: string | null | undefined, size: number): string | null {
  if (!src || !src.startsWith("http")) return null;
  const encoded = encodeURIComponent(src);
  return `https://images.weserv.nl/?url=${encoded}&w=${size * 2}&h=${size * 2}&fit=cover&output=jpg`;
}
