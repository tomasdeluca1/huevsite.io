import { Metadata } from "next";
import { profileService } from "@/lib/profile-service";
import { ProfileGrid } from "@/components/profile/ProfileGrid";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await profileService.getProfile(params.username);
  
  if (!profile) return { title: "Usuario no encontrado | huevsite.io" };

  const ogImageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://huevsite.io'}/api/og/${params.username}`;

  const heroBlock = profile.blocks.find(b => b.type === 'hero');
  const tagline = (heroBlock as any)?.tagline || 'Builder en huevsite.io';

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
        <header className="flex justify-between items-center mb-16 relative z-10">
          <Link href="/" className="logo">huev<span>site</span>.io</Link>
          
          <Link 
            href="/login"
            className="btn btn-ghost !px-6 !text-xs !py-3"
          >
            Buildá el tuyo 🇦🇷
          </Link>
        </header>

        {/* Bento Grid (Client Component for animations) */}
        <div className="relative z-10">
          <ProfileGrid
            blocks={profile.blocks}
            accentColor={profile.accentColor}
          />
        </div>

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
