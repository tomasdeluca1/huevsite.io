import { Metadata } from "next";
import { profileService } from "@/lib/profile-service";
import { ProfileGrid } from "@/components/profile/ProfileGrid";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isEnabled } from "@/lib/feature-flags";
import { EndorsementsSection } from "@/components/social/EndorsementsSection";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { MobileBottomNav, MobileStickyHeader } from "@/components/profile/MobileProfileUI";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWeek } from "@/lib/showcase-service";
import { ExploreNavigation } from "@/components/explore/ExploreNavigation";
import { headers } from "next/headers";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";

interface Props {
  params: { username: string };
  searchParams?: { from?: string; return_to?: string };
}

const OG_IMAGE_VERSION = "20260318";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await profileService.getProfile(username);

  if (!profile) return { title: "Usuario no encontrado | huevsite.io" };

  const heroBlock = profile.blocks.find(b => b.type === 'hero');
  const tagline = (heroBlock as any)?.tagline || 'Builder en huevsite.io';

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.huevsite.io';
  // Note: we can safely bypass standard Next metadata cache parameter using a bust cache hash
  // if required, but default Next app-router already suffixes ?hash. 
  // We'll explicitly define the absolute OG image URL since Next sometimes fails to resolve absolute paths automatically.
  const ogImageUrl = `${baseUrl}/${username}/opengraph-image?v=${OG_IMAGE_VERSION}`;

  return {
    title: `${profile.displayName} (@${profile.username}) | huevsite.io`,
    description: tagline,
    openGraph: {
      title: `${profile.displayName} (@${profile.username})`,
      description: tagline,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${profile.displayName} profile cover on huevsite.io`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${profile.displayName} (@${profile.username})`,
      description: tagline,
      images: [ogImageUrl],
    },
  };
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const profile = await profileService.getProfile(username);
  const navigationOrigin = searchParams?.from;
  const returnTo = searchParams?.return_to || (navigationOrigin === "feed" ? "/feed" : "/dashboard?tab=insights");

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

  return (
    <div className="landing min-h-screen font-display selection:bg-[var(--accent)] selection:text-black">
      {/* Noise Texture Overlay */}
      <div className="noise" />
      
      <AnalyticsTracker userId={profile.id!} visitorUserInfo={visitorUserInfo} />

      <main className="min-h-screen pt-8 md:pt-12 pb-16 md:pb-24 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        <ExploreNavigation currentUsername={username} isCustomDomain={isCustomDomain} />
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
          }
          ::selection {
            background-color: ${profile.accentColor};
            color: black;
          }
        `}} />

        {/* Mobile Specific UI */}
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

        <ProfileHeader
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
          subscriptionTier={profile.subscriptionTier}
          subSites={profile.subSites}
          blocks={profile.blocks}
          username={profile.username}
          isCustomDomain={isCustomDomain}
          isWinner={profile.isWinner}
        />

        {/* Huevsite Grid (Client Component for animations) */}
        <div className="relative z-10">
          <ProfileGrid
            blocks={profile.blocks}
            accentColor={profile.accentColor}
            displayName={profile.displayName}
            tagline={profile.tagline}
            subscriptionTier={profile.subscriptionTier}
            userId={profile.id}
            isWinner={profile.isWinner}
            subSites={profile.subSites}
            username={username}
            isCustomDomain={isCustomDomain}
          />
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
        <footer className="mt-20 md:mt-32 text-center relative z-10 border-t border-white/5 pt-12 pb-8">
          <div className="section-label !text-[var(--text-muted)] opacity-30">
            // builder logic • {profile.displayName} &apos;s huevsite
          </div>
          {profile.subscriptionTier !== "pro" && (
            <div className="logo mt-4 scale-75 opacity-10 filter grayscale select-none">huev<span>site</span>.io</div>
          )}
        </footer>
      </main>
    </div>
  );
}
