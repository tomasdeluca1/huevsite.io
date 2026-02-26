import { Metadata } from "next";
import { profileService } from "@/lib/profile-service";
import { ProfileGrid } from "@/components/profile/ProfileGrid";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isEnabled } from "@/lib/feature-flags";
import { EndorsementsSection } from "@/components/social/EndorsementsSection";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: { username: string };
}

function getCurrentWeek(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await profileService.getProfile(params.username);

  if (!profile) return { title: "Usuario no encontrado | huevsite.io" };

  const heroBlock = profile.blocks.find(b => b.type === 'hero');
  const tagline = (heroBlock as any)?.tagline || 'Builder en huevsite.io';

  const cacheBuster = Date.now();
  const searchParams = new URLSearchParams({
    username: params.username,
    title: profile.displayName || params.username,
    tagline: tagline,
    color: profile.accentColor || '#C8FF00',
    v: cacheBuster.toString()
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://huevsite.io';
  const ogImageUrl = `${baseUrl}/api/og?${searchParams.toString()}`;

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
          alt: profile.displayName,
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

export default async function ProfilePage({ params }: Props) {
  const profile = await profileService.getProfile(params.username);

  if (!profile) {
    notFound();
  }

  // Social: verificar si el usuario actual ya sigue este perfil
  let currentUserId: string | null = null;
  let isFollowing = false;

  let followersCount = 0;
  let followingCount = 0;
  let nominationsCount = 0;
  let hasNominated = false;

  const currentWeek = getCurrentWeek();

  if (isEnabled("socialNetwork") && profile.id) {
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

      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id ?? null;

      if (currentUserId && currentUserId !== profile.id) {
        const [{ data: follow }, { data: nomination }] = await Promise.all([
          supabase.from("follows").select("id").eq("follower_id", currentUserId).eq("following_id", profile.id).maybeSingle(),
          supabase.from("showcase_nominations").select("id").eq("nominated_by", currentUserId).eq("user_id", profile.id).eq("week", currentWeek).maybeSingle()
        ]);
        isFollowing = !!follow;
        hasNominated = !!nomination;
      }
    } catch {
      // ignorar errores de auth en perfil público
    }
  }

  const showFollowButton =
    isEnabled("socialNetwork") &&
    !!profile.id &&
    !!currentUserId &&
    currentUserId !== profile.id;

  return (
    <div className="landing min-h-screen font-display">
      <main className="min-h-screen pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-10 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${profile.accentColor} 0%, transparent 70%)`
          }}
        />

        {/* Header / Nav */}
        <ProfileHeader 
          profileId={profile.id}
          isFollowing={isFollowing}
          followersCount={followersCount}
          followingCount={followingCount}
          nominationsCount={nominationsCount}
          accentColor={profile.accentColor}
          showFollowButton={showFollowButton}
          currentUserId={currentUserId}
          isEnabledSocialNetwork={isEnabled("socialNetwork")}
        />

        {/* Bento Grid (Client Component for animations) */}
        <div className="relative z-10">
          <ProfileGrid
            blocks={profile.blocks}
            accentColor={profile.accentColor}
            displayName={profile.displayName}
            tagline={profile.tagline}
          />
        </div>

        {/* Endorsements (feature flag: red social) */}
        {isEnabled("socialNetwork") && profile.id && (
          <div className="relative z-10 max-w-4xl mx-auto mt-8">
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
        <footer className="mt-40 text-center relative z-10">
          <div className="section-label !text-[var(--text-muted)] opacity-50">
            // builder logic • {profile.displayName} &apos;s huevsite
          </div>
          <div className="logo mt-4 scale-75 opacity-20 filter grayscale">huev<span>site</span>.io</div>
        </footer>
      </main>
    </div>
  );
}
