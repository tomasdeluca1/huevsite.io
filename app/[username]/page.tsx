import { Metadata } from "next";
import { profileService } from "@/lib/profile-service";
import { ProfileGrid } from "@/components/profile/ProfileGrid";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isEnabled } from "@/lib/feature-flags";
import { EndorsementsSection } from "@/components/social/EndorsementsSection";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileSocialBar } from "@/components/profile/ProfileSocialBar";
import { WinnerBanner } from "@/components/profile/WinnerBanner";
import { getBdlsSlugsByUsername } from "@/lib/blog-data";
import { MobileBottomNav, MobileStickyHeader } from "@/components/profile/MobileProfileUI";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWeek } from "@/lib/showcase-service";
import { ExploreNavigation } from "@/components/explore/ExploreNavigation";
import { headers } from "next/headers";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { SITE_URL } from "@/lib/site-url";
import { safeJsonLd } from "@/lib/json-ld";
import { breadcrumbLd, profilePageLd } from "@/lib/structured-data";
import { keywordsFor } from "@/lib/seo";
import { getLocale } from "@/lib/locale";

interface Props {
  params: { username: string };
  searchParams?: { from?: string; return_to?: string; embed?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await profileService.getProfile(username);

  if (!profile) return { title: "Usuario no encontrado | huevsite.io" };

  const heroBlock = profile.blocks.find(b => b.type === 'hero');
  const rawTagline = (heroBlock as any)?.tagline || profile.tagline || '';
  const tagline = rawTagline || 'Builder en huevsite.io';

  const ogImageVersion = profile.ogImageVersion || "botw-none-default";
  // Use a winner-aware cache buster so social crawlers fetch a fresh OG image
  // when the current Builder of the Week changes and the badge state flips.
  const ogImageUrl = `${SITE_URL}/api/og/${username}?v=${encodeURIComponent(ogImageVersion)}`;

  // Build a title (~50-60 chars) and description (~110-160 chars) so social
  // previews aren't flagged as too short. Lead with the name + a descriptor.
  const clamp = (s: string, max: number) =>
    s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
  const displayName = profile.displayName || profile.username;
  const roles = Array.isArray((profile as any).roles) ? (profile as any).roles.filter(Boolean) : [];
  const hasRealTagline = Boolean(rawTagline);
  const descriptor = hasRealTagline
    ? rawTagline
    : roles.length
      ? roles.slice(0, 2).join(" · ")
      : "Builder en huevsite.io";

  const baseTitle = `${displayName} — ${descriptor}`;
  // Keep the title around 50-60 chars: enrich short ones with @handle + brand.
  const ogTitle = clamp(
    baseTitle.length >= 50
      ? baseTitle
      : `${displayName} (@${profile.username}) · ${descriptor} | huevsite.io`,
    66
  );
  // Keep the description around 110-160 chars.
  const ogDescription = clamp(
    hasRealTagline
      ? `${rawTagline} · Conocé los proyectos, el stack, las métricas y los logros de ${displayName} (@${profile.username}) en huevsite.io.`
      : `Conocé los proyectos, el stack, las métricas y los logros de ${displayName} (@${profile.username}) en huevsite.io — el perfil para builders que muestran lo que shippean.`,
    160
  );

  const locale = await getLocale();
  // Keywords blend the generic profile set with what this builder actually
  // does (roles + stack), so the page carries its own long-tail terms instead
  // of repeating the site-wide list on every profile.
  const stackItems: string[] = profile.blocks
    .filter((b) => b.type === "stack")
    .flatMap((b) => ((b as any)?.items ?? (b as any)?.data?.items ?? []) as string[])
    .filter((item): item is string => typeof item === "string" && item.length > 0);

  return {
    title: ogTitle,
    description: ogDescription,
    keywords: [
      ...keywordsFor("profile", locale),
      displayName,
      profile.username,
      ...roles.slice(0, 4),
      ...Array.from(new Set(stackItems)).slice(0, 10),
    ].filter(Boolean),
    alternates: {
      canonical: `${SITE_URL}/${profile.username}`,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: `${SITE_URL}/${profile.username}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${displayName} (@${profile.username}) en huevsite.io`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImageUrl],
    },
  };
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const profile = await profileService.getProfile(username);
  const navigationOrigin = searchParams?.from;
  const returnTo = searchParams?.return_to || (navigationOrigin === "feed" ? "/feed" : "/dashboard?tab=insights");
  // Embed mode (?embed=1): chrome-less profile for iframing on other platforms
  // (e.g. nordelta.tech community cards). Hides nav + footer, keeps header/grid.
  const embed = searchParams?.embed === "1";

  if (!profile) {
    notFound();
  }

  const headersList = headers();
  const host = headersList.get("host") || "";
  const isCustomDomain = host === profile.customDomain && !!profile.customDomain;

  // Social: verificar si el usuario actual ya sigue este perfil
  let currentUserId: string | null = null;
  let isFollowing = false;
  let visitorUserInfo: { user_id: string; username: string; name: string | null; avatar: string | null } | null = null;

  let followersCount = 0;
  let followingCount = 0;
  let nominationsCount = 0;
  let hasNominated = false;

  const currentWeek = getCurrentWeek();

  // Always try to get the logged-in visitor's identity for analytics tracking
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    currentUserId = user?.id ?? null;

    // If a different logged-in user is visiting, fetch their profile for the visitors list
    if (currentUserId && currentUserId !== profile.id) {
      const { data: visitorProfile } = await supabase
        .from("profiles")
        .select("id, username, name, image")
        .eq("id", currentUserId)
        .maybeSingle();

      if (visitorProfile) {
        visitorUserInfo = {
          user_id: visitorProfile.id,
          username: visitorProfile.username,
          name: visitorProfile.name || null,
          avatar: visitorProfile.image || null,
        };
      }
    }
  } catch {
    // ignorar errores de auth en perfil público
  }

  if (isEnabled("socialNetwork") && profile.id && currentUserId) {
    try {
      const supabase = await createClient();

      // Fetch follower counts and nominations
      const [
        { count: fers },
        { count: fing },
        { count: noms }
      ] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
        supabase.from("showcase_nominations").select("*", { count: "exact", head: true }).eq("user_id", profile.id).eq("week", currentWeek)
      ]);

      followersCount = fers || 0;
      followingCount = fing || 0;
      nominationsCount = noms || 0;

      if (currentUserId !== profile.id) {
        const [{ data: follow }, { data: nomination }] = await Promise.all([
          supabase.from("follows").select("id").eq("follower_id", currentUserId).eq("following_id", profile.id).maybeSingle(),
          supabase.from("showcase_nominations").select("id").eq("nominated_by", currentUserId).eq("user_id", profile.id).eq("week", currentWeek).maybeSingle()
        ]);
        isFollowing = !!follow;
        hasNominated = !!nomination;
      }
    } catch {
      // ignorar errores de social queries
    }
  } else if (isEnabled("socialNetwork") && profile.id) {
    // Still fetch public counts even for anonymous visitors
    try {
      const supabase = await createClient();
      const [{ count: fers }, { count: fing }, { count: noms }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
        supabase.from("showcase_nominations").select("*", { count: "exact", head: true }).eq("user_id", profile.id).eq("week", currentWeek)
      ]);
      followersCount = fers || 0;
      followingCount = fing || 0;
      nominationsCount = noms || 0;
    } catch {}
  }

  const showFollowButton =
    isEnabled("socialNetwork") &&
    !!profile.id &&
    currentUserId !== profile.id;

  // BDLS winner banner: link to the builder's published "Builder de la Semana"
  // blog post. Match by author (slugs are inconsistent), only when one exists.
  let bdlsNotaHref: string | null = null;
  if (profile.winnerWeek) {
    try {
      const bdlsSlugs = await getBdlsSlugsByUsername();
      const slug = bdlsSlugs[(profile.username || "").toLowerCase()];
      if (slug) bdlsNotaHref = `/blog/${slug}`;
    } catch {}
  }

  // ProfilePage + Person. Google has a dedicated treatment for creator/profile
  // pages, and this is what makes a query for the builder's own name resolve
  // to their huevsite profile instead of a random social account. Everything
  // here is user-authored, so it MUST go through safeJsonLd.
  const heroData: any = profile.blocks.find((b) => b.type === "hero") ?? {};
  const profileRoles: string[] = Array.isArray(heroData.roles) ? heroData.roles.filter(Boolean) : [];
  const profileSkills: string[] = Array.from(
    new Set(
      profile.blocks
        .filter((b) => b.type === "stack")
        .flatMap((b: any) => (b.items ?? b.data?.items ?? []) as string[])
        .filter((item: unknown): item is string => typeof item === "string" && item.length > 0)
    )
  );
  const profileSameAs: string[] = Array.from(
    new Set(
      [
        profile.githubHandle ? `https://github.com/${profile.githubHandle}` : null,
        ...profile.blocks
          .filter((b) => b.type === "social")
          .flatMap((b: any) => ((b.links ?? b.data?.links ?? []) as any[]).map((l) => l?.url)),
      ].filter((url): url is string => typeof url === "string" && /^https?:\/\//.test(url))
    )
  );

  const profileUrl = `${SITE_URL}/${profile.username}`;
  const profileJsonLd = [
    profilePageLd({
      username: profile.username,
      displayName: profile.displayName || profile.username,
      description: heroData.tagline || profile.tagline || `Builder en huevsite.io`,
      url: profileUrl,
      image: profile.avatarUrl || null,
      location: heroData.location || null,
      roles: profileRoles,
      skills: profileSkills,
      sameAs: profileSameAs,
    }),
    breadcrumbLd([
      { name: "huevsite.io", path: "/" },
      { name: "Builders", path: "/explore" },
      { name: `@${profile.username}`, path: `/${profile.username}` },
    ]),
  ];

  return (
    <div className="landing min-h-screen font-display selection:bg-[var(--accent)] selection:text-black">
      {/* Noise Texture Overlay */}
      <div className="noise" />

      {/* Skipped in embed mode: the iframed copy on a third-party page would
          duplicate the host page's structured data.

          Plain <script>, NOT next/script: with strategy="beforeInteractive"
          next/script only ships the tag inside the RSC flight payload and
          injects it client-side, so the JSON-LD was absent from the server
          HTML entirely — invisible to every crawler that doesn't run JS
          (Bing, LinkedIn, and the AI bots robots.txt explicitly invites). */}
      {!embed && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(profileJsonLd) }}
        />
      )}
      
      <AnalyticsTracker userId={profile.id!} visitorUserInfo={visitorUserInfo} />

      <main className={`min-h-screen ${embed ? "pt-4" : "pt-5 md:pt-12"} pb-16 md:pb-24 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto relative`}>
        {!embed && <ExploreNavigation currentUsername={username} isCustomDomain={isCustomDomain} />}
        {/* Dynamic Cinematic Backgrounds */}
        <div
          className="fixed top-[-10%] left-[-10%] w-[80%] md:w-[50%] h-[50%] opacity-[0.08] blur-[120px] pointer-events-none transition-all duration-1000"
          style={{ backgroundColor: profile.accentColor }}
        />
        <div
          className="fixed bottom-[-10%] right-[-10%] w-[60%] md:w-[40%] h-[40%] opacity-[0.05] blur-[100px] pointer-events-none transition-all duration-1000"
          style={{ backgroundColor: profile.accentColor }}
        />

        <style dangerouslySetInnerHTML={{
          __html: `
          :root {
            --accent: ${profile.accentColor};
            --accent-dim: ${profile.accentColor}1f;
            --accent-mid: ${profile.accentColor}4d;
            --white: #F2F2F2;
            --radius-xl: ${profile.borderRadius || '1.5rem'};
          }
          ::selection {
            background-color: ${profile.accentColor};
            color: black;
          }
        `}} />

        {/* Mobile Specific UI */}
        {!embed && (
          <>
            <MobileStickyHeader
              displayName={profile.displayName || profile.username}
              avatarUrl={profile.avatarUrl}
              builderScore={profile.builderScore || 0}
              accentColor={profile.accentColor}
              username={profile.username}
              isCustomDomain={isCustomDomain}
              isWinner={profile.isWinner}
            />
            <MobileBottomNav accentColor={profile.accentColor} currentUserId={currentUserId} isCustomDomain={isCustomDomain} />
          </>
        )}

        {/* Header / Nav */}
        {(navigationOrigin === "insights" || navigationOrigin === "feed") && (
          <div className="relative z-10 mb-6 flex justify-center md:mb-8">
            <Link
              href={returnTo}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/70 transition-all hover:border-white/20 hover:text-white"
            >
              {navigationOrigin === "feed" ? "← Volver al feed" : "← Volver al dashboard"}
            </Link>
          </div>
        )}

        {/* Mobile-first ordering: the board (ProfileGrid) leads on phones so you
            see the builder's content on entry; the social stats + follow/nominate
            (ProfileSocialBar) drop below it. Desktop keeps the classic order
            (header → stats → winner chip → board) via md:order-*. */}
        <div className="flex flex-col">
          <div className="order-1">
            <ProfileHeader
              accentColor={profile.accentColor}
              currentUserId={currentUserId}
              subscriptionTier={profile.subscriptionTier}
              borderRadius={profile.borderRadius}
              subSites={profile.subSites}
              blocks={profile.blocks}
              username={profile.username}
              isCustomDomain={isCustomDomain}
              embed={embed}
            />
          </div>

          <ProfileSocialBar
            className="order-4 mt-8 md:order-2 md:mt-0 md:mb-8"
            profileId={profile.id}
            isFollowing={isFollowing}
            followersCount={followersCount}
            followingCount={followingCount}
            nominationsCount={nominationsCount}
            builderScore={profile.builderScore || 0}
            accentColor={profile.accentColor}
            showFollowButton={showFollowButton}
            currentUserId={currentUserId}
            isEnabledSocialNetwork={isEnabled("socialNetwork")}
            embed={embed}
          />

          {!embed && profile.winnerWeek && (
            <div className="order-2 md:order-3">
              <WinnerBanner
                winnerWeek={profile.winnerWeek}
                notaHref={bdlsNotaHref}
                historyHref="/builders-de-la-semana"
              />
            </div>
          )}

          {/* Huevsite Grid (Client Component for animations) */}
          <div className="order-3 relative z-10 md:order-4">
            <ProfileGrid
              blocks={profile.blocks}
              accentColor={profile.accentColor}
              displayName={profile.displayName}
              tagline={profile.tagline}
              subscriptionTier={profile.subscriptionTier}
              userId={profile.id}
              isWinner={profile.isWinner}
              winnerWeek={profile.winnerWeek}
              badges={profile.badges}
              subSites={profile.subSites}
              username={username}
              isCustomDomain={isCustomDomain}
            />
          </div>
        </div>

        {/* Endorsements (feature flag: red social) */}
        {isEnabled("socialNetwork") && profile.id && (
          <div className="relative z-10 max-w-4xl mx-auto mt-16 md:mt-24 pb-12">
            <EndorsementsSection
              profileId={profile.id}
              profileAccentColor={profile.accentColor}
              currentUserId={currentUserId}
              isFollowing={isFollowing}
              hasNominated={hasNominated}
            />
          </div>
        )}

        {/* Footer message */}
        {!embed && (
          <footer className="mt-20 md:mt-32 text-center relative z-10 border-t border-white/5 pt-12 pb-8">
            <div className="section-label !text-[var(--text-muted)] opacity-30">
              // builder logic • {profile.displayName} &apos;s huevsite
            </div>
            {profile.subscriptionTier !== "pro" && (
              <div className="logo mt-4 scale-75 opacity-10 filter grayscale select-none">huev<span>site</span>.io</div>
            )}
          </footer>
        )}
      </main>
    </div>
  );
}
