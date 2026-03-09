import { Metadata } from "next";
import { profileService } from "@/lib/profile-service";
import { ProfileGrid } from "@/components/profile/ProfileGrid";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { MobileBottomNav, MobileStickyHeader } from "@/components/profile/MobileProfileUI";
import { createClient } from "@/lib/supabase/server";

interface Props {
    params: { username: string; slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const profile = await profileService.getSubSiteProfile(params.username, params.slug);

    if (!profile) return { title: "Sub-site no encontrado | huevsite.io" };

    return {
        title: `${profile.displayName} | @${params.username} | huevsite.io`,
        description: profile.tagline,
    };
}

export default async function SubSitePage({ params }: Props) {
    const profile = await profileService.getSubSiteProfile(params.username, params.slug);

    if (!profile) {
        notFound();
    }

    // En sub-sites por ahora no mostramos endorsements a menos que sea necesario
    // Se renderiza el grid con los bloques asociados a este sub-site
    let currentUserId: string | null = null;

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id ?? null;
    } catch {
        // ignore auth error
    }

    return (
        <div className="landing min-h-screen font-display selection:bg-[var(--accent)] selection:text-black">
            <div className="noise" />

            <main className="min-h-screen pt-8 md:pt-12 pb-16 md:pb-24 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
                <div
                    className="fixed top-[-10%] left-[-10%] w-[80%] md:w-[50%] h-[50%] opacity-[0.08] blur-[120px] pointer-events-none transition-all duration-1000"
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
        `}} />

                <MobileStickyHeader
                    displayName={profile.displayName}
                    avatarUrl={profile.avatarUrl}
                    builderScore={profile.builderScore || 0}
                    accentColor={profile.accentColor}
                    username={profile.username}
                />
                <MobileBottomNav accentColor={profile.accentColor} currentUserId={currentUserId} />

                <ProfileHeader
                    profileId={profile.id}
                    isFollowing={false}
                    followersCount={0}
                    followingCount={0}
                    nominationsCount={0}
                    builderScore={profile.builderScore || 0}
                    accentColor={profile.accentColor}
                    showFollowButton={false}
                    currentUserId={currentUserId}
                    isEnabledSocialNetwork={false}
                    subscriptionTier={profile.subscriptionTier}
                    username={profile.username}
                />

                <div className="relative z-10">
                    <ProfileGrid
                        blocks={profile.blocks}
                        accentColor={profile.accentColor}
                        displayName={profile.displayName}
                        tagline={profile.tagline}
                        subscriptionTier={profile.subscriptionTier}
                    />
                </div>

                <footer className="mt-20 md:mt-32 text-center relative z-10 border-t border-white/5 pt-12 pb-8">
                    <Link href={`/${profile.username}`} className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors uppercase tracking-widest">
                        ← Volver al perfil de {profile.username}
                    </Link>
                    <div className="logo mt-8 scale-75 opacity-10 filter grayscale select-none">huev<span>site</span>.io</div>
                </footer>
            </main>
        </div>
    );
}
