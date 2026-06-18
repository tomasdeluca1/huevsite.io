import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import LocaleToggle from '@/components/LocaleToggle';
import { RecruiterTalentBoard, type RecruiterTalent } from '@/components/recruiter/RecruiterTalentBoard';

// Señales de "open to work" en el status libre del hero block
// (no existe una columna dedicada — el status es texto que escribe el usuario).
const OPEN_TO_WORK_RE = /dispon|open\s*to\s*work|available|busco|buscando|freelance|hire/i;

async function getTalent(): Promise<RecruiterTalent[]> {
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
        .select('id, username, name, tagline, image, location, builder_score, github_handle, blocks (type, data)')
        .not('username', 'is', null)
        .order('builder_score', { ascending: false, nullsFirst: false })
        .limit(50);

    if (error || !data) {
        if (error) console.error('[recruiter] getTalent error:', error.message);
        return [];
    }

    return data.map(profile => {
        // Extraer stack
        let mainStack: string[] = [];
        const stackBlocks = profile.blocks?.filter((b: any) => b.type === 'stack') || [];
        stackBlocks.forEach((sb: any) => {
            if (sb.data?.items && Array.isArray(sb.data.items)) {
                mainStack = [...mainStack, ...sb.data.items];
            }
        });

        // El status vive en el hero block (texto libre tipo "Disponible para proyectos")
        const heroStatus = (profile.blocks || [])
            .filter((b: any) => b.type === 'hero')
            .map((b: any) => b.data?.status)
            .find((s: any) => typeof s === 'string' && s.trim()) || null;

        return {
            id: profile.id,
            username: profile.username,
            name: profile.name,
            tagline: profile.tagline,
            image: profile.image,
            location: profile.location,
            builder_score: profile.builder_score,
            mainStack: Array.from(new Set(mainStack)).slice(0, 5), // Top 5
            heroStatus,
            openToWork: OPEN_TO_WORK_RE.test(heroStatus || ''),
        };
    });
}

export default async function RecruiterDashboard() {
    const talentList = await getTalent();
    const t = await getTranslations('recruiter');

    return (
        <div className="min-h-screen bg-[var(--bg)] font-display text-white selection:bg-[#C8FF00]/30 selection:text-[#C8FF00]">
            {/* Navbar Premium */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-black/60 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="logo text-xl">huev<span className="text-white">site</span>.io</Link>
                        <div className="h-6 w-px bg-[var(--border)]" />
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#C8FF00]">
                            <Briefcase size={16} /> {t('mode')}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-mono text-[var(--text-muted)]">
                        <LocaleToggle />
                        {t('proAccess')}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
                            {t('titleLine1')} <br /><span className="text-gradient">{t('titleLine2')}</span>
                        </h1>
                        <p className="text-[var(--text-dim)] max-w-lg leading-relaxed pt-2">
                            {t.rich('subtitle', { strong: (chunks) => <strong className="text-white">{chunks}</strong> })}
                        </p>
                    </div>
                </div>

                <RecruiterTalentBoard talent={talentList} />
            </main>
        </div>
    );
}
