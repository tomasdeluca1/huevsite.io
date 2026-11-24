import { ImageResponse } from 'next/og';
import { profileService } from '@/lib/profile-service';
import { ogAvatarUrl } from '@/lib/og-avatar';
import { OG_SIZE, BrandFallback } from '@/lib/og/shared';
import { ProfileHypeCard, computeRealStats } from '@/lib/og/profile-hype';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// A valid branded PNG for every failure path (missing profile, DB error, bad
// data). This route doubles as an avatar fallback elsewhere, so it must never
// return a 500/404 that would render as a broken <img>.
function fallback() {
  return new ImageResponse(<BrandFallback />, { ...OG_SIZE });
}

// weserv has returned both 404s (source avatar 403s upstream) and 15s+ hangs
// for specific profiles. Never hand an unverified URL to Satori's <img>: probe
// it first with a hard timeout and bail to the monogram placeholder.
async function verifiedAvatarSrc(avatarUrl: string | null | undefined, size: number): Promise<string | null> {
  const src = ogAvatarUrl(avatarUrl, size);
  if (!src) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2500);
  try {
    const res = await fetch(src, { signal: ctrl.signal });
    const type = res.headers.get('content-type') || '';
    if (!res.ok || !type.startsWith('image/')) return null;
    return src;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function loadFonts(req: Request) {
  try {
    // Hard 2.5s cap: a slow font fetch must not stall the crawler; on
    // timeout we render with Satori's bundled font instead.
    const signal = AbortSignal.timeout(2500);
    const get = (f: string) =>
      fetch(new URL(`/fonts/${f}`, req.url), { signal }).then((r) => {
        if (!r.ok) throw new Error(`font ${r.status}`);
        return r.arrayBuffer();
      });
    const [bold, regular, mono] = await Promise.all([
      get('Bricolage-800.ttf'),
      get('Bricolage-400.ttf'),
      get('JetBrainsMono-700.ttf'),
    ]);
    return [
      { name: 'Bricolage', data: bold, weight: 900 as const, style: 'normal' as const },
      { name: 'Bricolage', data: regular, weight: 400 as const, style: 'normal' as const },
      { name: 'JetBrainsMono', data: mono, weight: 700 as const, style: 'normal' as const },
    ];
  } catch {
    return undefined;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    // Profile, fonts and nothing else in parallel; the avatar probe needs the
    // profile's avatar URL so it runs right after.
    const [profile, fonts] = await Promise.all([
      profileService.getProfile(username),
      loadFonts(request),
    ]);
    if (!profile) return fallback();

    const avatarSrc = await verifiedAvatarSrc(profile.avatarUrl, 210);

    return new ImageResponse(
      (
        <ProfileHypeCard
          username={username}
          displayName={profile.displayName || username}
          score={profile.builderScore || 0}
          isWinner={profile.isWinner || false}
          avatarSrc={avatarSrc}
          badges={(profile.badges || []).slice(0, 5)}
          stats={computeRealStats(profile)}
          fontLoaded={Boolean(fonts)}
        />
      ),
      {
        ...OG_SIZE,
        ...(fonts ? { fonts } : {}),
      }
    );
  } catch {
    return fallback();
  }
}
