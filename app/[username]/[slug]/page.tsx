import { Metadata } from "next";
import { profileService } from "@/lib/profile-service";
import { ProfileGrid } from "@/components/profile/ProfileGrid";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MobileBottomNav, MobileStickyHeader } from "@/components/profile/MobileProfileUI";
import { createClient } from "@/lib/supabase/server";

import { headers } from "next/headers";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { SITE_URL } from "@/lib/site-url";

interface Props {
    params: { username: string; slug: string };
}

const OG_IMAGE_VERSION = "20260318a";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username, slug } = await params;
    const profile = await profileService.getSubSiteProfile(username, slug);

    if (!profile) return { title: "Sub-site no encontrado | huevsite.io" };

    const pageUrl = `${SITE_URL}/${username}/${slug}`;
    const ogImageUrl = `${SITE_URL}/api/og/${username}/${slug}?v=${OG_IMAGE_VERSION}`;

    return {
        title: `${profile.displayName} | @${username} | huevsite.io`,
        description: profile.tagline,
        alternates: {
            canonical: pageUrl,
        },
        openGraph: {
            title: `${profile.displayName} | @${username}`,
            description: profile.tagline,
            url: pageUrl,
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: `${profile.displayName} sub-site cover on huevsite.io`,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `${profile.displayName} | @${username}`,
            description: profile.tagline,
            images: [ogImageUrl],
        },
    };
}

export default async function SubSitePage({ params }: Props) {
    const { username, slug } = await params;
    const profile = await profileService.getSubSiteProfile(username, slug);

    if (!profile) {
        notFound();
    }

    const headersList = headers();
    const host = headersList.get("host") || "";
    const isCustomDomain = host === profile.customDomain && !!profile.customDomain;

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
            
            <AnalyticsTracker userId={profile.id!} subSiteId={profile.subSiteId} />

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

                {/* Perfil identity bar removed for a cleaner sub-site view as requested */}

                {/* Parent Huevsite Reference - "Pie arriba del board" */}
                {profile.parentProfile && (
                    <div className="relative z-10 max-w-7xl mx-auto mb-8 md:mb-12 flex justify-center">
                        <Link
                            href={isCustomDomain ? "/" : `/${profile.parentProfile.username}`}
                            className="group flex flex-col sm:flex-row items-center gap-4 backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] hover:border-[var(--accent)]/30 hover:shadow-[0_8px_32px_-12px_var(--accent-dim)] px-6 sm:px-8 py-4 rounded-[2rem] transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/10 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            
                            <div className="text-[9px] font-mono text-[var(--accent)] uppercase tracking-[0.2em] font-bold text-center sm:text-left">
                                // CREADOR <span className="hidden sm:inline">・</span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {profile.parentProfile.avatarUrl ? (
                                    <img src={profile.parentProfile.avatarUrl} alt={profile.parentProfile.displayName} className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/10 shadow-sm object-cover bg-black" />
                                ) : (
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black border border-white/10 flex items-center justify-center text-[10px] md:text-sm font-black uppercase text-white shadow-sm">
                                        {profile.parentProfile.displayName.substring(0, 2)}
                                    </div>
                                )}
                                <div className="flex flex-col min-w-0 text-center sm:text-left">
                                    <span className="text-[13px] sm:text-sm font-black text-white group-hover:text-[var(--accent)] transition-colors leading-tight tracking-tight">
                                        {profile.parentProfile.displayName} <span className="text-[11px] font-medium opacity-50 font-mono">(@{profile.parentProfile.username})</span>
                                    </span>
                                    {profile.parentProfile.tagline && (
                                        <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] mt-0.5 truncate max-w-[200px] sm:max-w-[300px]">
                                            {profile.parentProfile.tagline}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    </div>
                )}

                <div className="relative z-10">
                    <ProfileGrid
                        blocks={profile.blocks}
                        accentColor={profile.accentColor}
                        displayName={profile.displayName}
                        tagline={profile.tagline}
                        subscriptionTier={profile.subscriptionTier}
                        userId={profile.id}
                        subSiteId={profile.subSiteId}
                        subSites={profile.subSites}
                        username={profile.username}
                        isCustomDomain={isCustomDomain}
                    />
                </div>

                <footer className="mt-20 md:mt-32 text-center relative z-10 border-t border-white/5 pt-12 pb-8">
                    <Link href={isCustomDomain ? "/" : `/${username}`} className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors uppercase tracking-widest">
                        ← Volver al perfil de {username}
                    </Link>
                    <div className="logo mt-8 scale-75 opacity-10 filter grayscale select-none">huev<span>site</span>.io</div>
                </footer>
            </main>
        </div>
    );
}
