import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ProfileGrid } from "@/components/profile/ProfileGrid";
import Link from "next/link";
import { ArrowLeft, Share2, Globe, Rocket } from "lucide-react";

async function getSubSiteData(username: string, subSiteId: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); } } }
    );

    // 1. Fetch profile and sub_site info
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, username, accent_color, tagline')
        .eq('username', username)
        .single();

    if (!profile) return null;

    const { data: subSite } = await supabase
        .from('sub_sites')
        .select('*')
        .eq('id', subSiteId)
        .eq('user_id', profile.id)
        .single();

    if (!subSite) return null;

    // 2. Fetch blocks for this sub_site
    const { data: blocks } = await supabase
        .from('blocks')
        .select('*')
        .eq('user_id', profile.id)
        .eq('sub_site_id', subSiteId)
        .eq('visible', true)
        .order('order', { ascending: true });

    return {
        profile,
        subSite,
        blocks: (blocks || []).map(b => {
            const { id, type, order, col_span, row_span, visible, ...data } = b.data || {};
            return { id: b.id, type: b.type, order: b.order, col_span: b.col_span, row_span: b.row_span, visible: b.visible, ...data };
        })
    };
}

export default async function SubSitePage({ params }: { params: { username: string, id: string } }) {
    const data = await getSubSiteData(params.username, params.id);

    if (!data) notFound();

    const { profile, subSite, blocks } = data;

    return (
        <div className="min-h-screen bg-[var(--bg)] font-display text-white overflow-x-hidden selection:bg-[var(--accent)] selection:text-black">
            <style dangerouslySetInnerHTML={{
                __html: `
        :root {
          --accent: ${profile.accent_color || '#C8FF00'};
          --accent-dim: ${profile.accent_color || '#C8FF00'}1f;
        }
      `}} />

            {/* Navigation */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 h-20">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                    <Link
                        href={`/${profile.username}`}
                        className="flex items-center gap-3 text-sm font-bold text-[var(--text-muted)] hover:text-white transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition-colors">
                            <ArrowLeft size={18} />
                        </div>
                        <span className="hidden md:inline">Volver al perfil de {profile.name || profile.username}</span>
                        <span className="md:hidden">Volver</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-mono uppercase tracking-[0.2em] px-3 py-1 bg-[#C8FF00]/10 text-[#C8FF00] rounded-full border border-[#C8FF00]/20 font-bold hidden md:block">
                            Project Showcase
                        </div>
                        <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
                            <Share2 size={18} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
                <header className="mb-16 md:mb-24 flex flex-col items-center text-center">
                    <div className="flex items-center gap-3 mb-6">
                        <Rocket size={32} className="text-[var(--accent)]" />
                        <div className="h-px w-12 bg-[var(--accent)] opacity-20" />
                        <div className="text-xs font-mono uppercase tracking-[0.3em] font-medium text-[var(--text-muted)]">Building in public</div>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 max-w-4xl leading-[0.9]">
                        {subSite.title}
                    </h1>

                    {subSite.description && (
                        <p className="text-xl md:text-2xl text-[var(--text-dim)] max-w-2xl leading-relaxed italic font-medium">
                            "{subSite.description}"
                        </p>
                    )}

                    <div className="mt-12 flex flex-wrap justify-center gap-3">
                        <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2 text-sm font-bold">
                            <Globe size={16} className="text-[var(--accent)]" />
                            <span>Sitio del proyecto</span>
                        </div>
                    </div>
                </header>

                {/* Project Blocks */}
                <div className="relative">
                    {/* Decorative elements */}
                    <div className="absolute -top-40 -left-60 w-[600px] h-[600px] bg-[var(--accent)] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute top-40 -right-60 w-[600px] h-[600px] bg-blue-500 opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />

                    <ProfileGrid
                        blocks={blocks as any}
                        accentColor={profile.accent_color || '#C8FF00'}
                        displayName={profile.name}
                        tagline={profile.tagline}
                    />
                </div>

                {/* Footer */}
                <footer className="mt-40 pt-20 border-t border-white/5 flex flex-col items-center gap-12">
                    <div className="text-center space-y-4">
                        <h3 className="section-label !text-[11px] font-black tracking-[0.4em]">// creado por</h3>
                        <Link href={`/${profile.username}`} className="flex flex-col items-center group">
                            <div className="text-3xl md:text-5xl font-extrabold hover:text-[var(--accent)] transition-colors tracking-tighter">
                                {profile.name || profile.username}
                            </div>
                            <div className="mt-2 text-[var(--text-dim)] font-mono text-sm opacity-50 group-hover:opacity-100 transition-opacity">
                                Ver perfil completo →
                            </div>
                        </Link>
                    </div>

                    <div className="flex gap-8 text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                        <Link href="/explore" className="hover:text-white transition-colors">Explorar Latam</Link>
                        <Link href="/feed" className="hover:text-white transition-colors">Lanzamientos</Link>
                        <span className="opacity-30">huevsite.io © 2026</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}
