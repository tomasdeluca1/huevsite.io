import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Search, MapPin, Code2, Award, Zap, Briefcase } from 'lucide-react';

async function getTalent() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
            }
        }
    );

    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, name, tagline, image, location, builder_score, current_status, github_handle, blocks (type, data)')
        .order('builder_score', { ascending: false, nullsFirst: false })
        .limit(50);

    if (error || !data) return [];

    return data.map(profile => {
        // Extraer stack
        let mainStack: string[] = [];
        const stackBlocks = profile.blocks?.filter((b: any) => b.type === 'stack') || [];
        stackBlocks.forEach((sb: any) => {
            if (sb.data?.items && Array.isArray(sb.data.items)) {
                mainStack = [...mainStack, ...sb.data.items];
            }
        });

        return {
            ...profile,
            mainStack: Array.from(new Set(mainStack)).slice(0, 5) // Top 5
        };
    });
}

export default async function RecruiterDashboard() {
    const talentList = await getTalent();

    return (
        <div className="min-h-screen bg-[var(--bg)] font-display text-white selection:bg-[#C8FF00]/30 selection:text-[#C8FF00]">
            {/* Navbar Premium */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-black/60 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="logo text-xl">huev<span className="text-white">site</span>.io</Link>
                        <div className="h-6 w-px bg-[var(--border)]" />
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#C8FF00]">
                            <Briefcase size={16} /> RECRUITER MODE
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-mono text-[var(--text-muted)]">
                        PRO Access
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
                            Encontrá el mejor <br /><span className="text-gradient">talento de latam.</span>
                        </h1>
                        <p className="text-[var(--text-dim)] max-w-lg leading-relaxed pt-2">
                            Listado clasificado dinámicamente según el <strong className="text-white">Builder Score</strong>, rankeando a quiénes más colaboran, aprenden y buildean.
                        </p>
                    </div>
                </div>

                {/* Talent Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Sidebar Filters */}
                    <aside className="lg:col-span-1 space-y-6">
                        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                            <h3 className="font-bold text-sm uppercase tracking-widest text-[#C8FF00] mb-6">// Filtros</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-mono text-[var(--text-muted)] block mb-2">Tech Stack</label>
                                    <input type="text" placeholder="ej. React, Python..." className="w-full bg-black/40 border border-[var(--border-bright)] rounded-xl px-4 py-3 text-sm focus:border-[#C8FF00] outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs font-mono text-[var(--text-muted)] block mb-2">Ubicación</label>
                                    <input type="text" placeholder="ej. Argentina, Remoto..." className="w-full bg-black/40 border border-[var(--border-bright)] rounded-xl px-4 py-3 text-sm focus:border-[#C8FF00] outline-none transition-colors" />
                                </div>
                                <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-black/20 cursor-pointer hover:border-[#C8FF00]/50 transition-colors">
                                    <input type="checkbox" className="accent-[#C8FF00]" />
                                    <span className="text-sm font-bold">Solo Open to Work</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-xs text-[#C8FF00] font-mono leading-relaxed">
                            ℹ️ El Builder Score se recalcula de forma automática basándose en proyectos, validación de la comunidad y actividad open source.
                        </div>
                    </aside>

                    {/* List */}
                    <div className="lg:col-span-3 space-y-4">
                        {talentList.map((dev: any) => (
                            <Link href={`/${dev.username}`} target="_blank" key={dev.id} className="block group">
                                <div className="bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] group-hover:border-[#C8FF00]/40 rounded-3xl p-6 transition-all duration-300 flex flex-col md:flex-row gap-6 relative overflow-hidden">

                                    {/* Decoration */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8FF00]/5 blur-3xl rounded-full" />

                                    <div className="flex gap-4 min-w-[300px]">
                                        {dev.image ? (
                                            <img src={dev.image} alt={dev.username} className="w-16 h-16 rounded-full object-cover border border-[var(--border)]" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center font-bold text-lg border border-[var(--border)] text-[#C8FF00]">
                                                {dev.username.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex flex-col justify-center">
                                            <h2 className="text-xl font-bold tracking-tight text-white mb-1 group-hover:text-[#C8FF00] transition-colors">{dev.name || dev.username}</h2>
                                            <div className="text-sm text-[var(--text-dim)] line-clamp-1">{dev.tagline || "Builder"}</div>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-center">
                                        {dev.mainStack && dev.mainStack.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {dev.mainStack.map((tech: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-black/40 border border-white/5 rounded pl-2 text-xs font-mono text-[var(--text-muted)]">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs font-mono text-white/20 italic">No stack indexado</div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-end gap-6 shrink-0 md:min-w-[200px] mt-4 md:mt-0 pt-4 md:pt-0 border-t border-[var(--border)] md:border-none">
                                        <div className="flex flex-col items-end">
                                            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mb-1">Score</div>
                                            <div className="flex items-center gap-2">
                                                <Award size={18} className="text-[#C8FF00]" />
                                                <span className="text-2xl font-black font-mono">{dev.builder_score || 0}</span>
                                            </div>
                                        </div>

                                        <div className="w-10 h-10 rounded-full border border-[var(--border-bright)] flex items-center justify-center -rotate-45 group-hover:rotate-0 group-hover:bg-[#C8FF00] group-hover:text-black group-hover:border-[#C8FF00] transition-all text-white">
                                            <Zap size={18} className="fill-current" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {talentList.length === 0 && (
                            <div className="text-center py-20 text-[var(--text-dim)] font-mono border border-dashed border-[var(--border)] rounded-3xl">
                                No se encontró talento rankeado aún.
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
