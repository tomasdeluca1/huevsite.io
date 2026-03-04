import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
// Removed unused scoreService import that was causing module resolution issues in standalone script

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Necesitamos service role para bypass RLS

if (!supabaseKey) {
    console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY no está configurada en .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAllScores() {
    console.log("🚀 Iniciando recalculone de scores para todos los usuarios...");

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username');

    if (error || !profiles) {
        console.error("❌ Error al obtener perfiles:", error);
        return;
    }

    console.log(`📋 Encontrados ${profiles.length} usuarios.`);

    for (const profile of profiles) {
        try {
            // Necesitamos una versión de scoreService que use el cliente con service role 
            // para asegurar que puede leer todo sin contexto de auth de usuario
            const score = await recomputeWithServiceRole(profile.id);
            console.log(`✅ @${profile.username}: ${score} pts`);
        } catch (err) {
            console.error(`❌ Error con @${profile.username}:`, err);
        }
    }

    console.log("✨ Sincronización completada.");
}

// Versión modificada para usar service role
async function recomputeWithServiceRole(userId: string): Promise<number> {
    const [profileRes, blocksRes, followsRes, nomsRes, endorsementsRes] = await Promise.all([
        supabase.from('profiles').select('name, tagline, image, github_handle').eq('id', userId).single(),
        supabase.from('blocks').select('type').eq('user_id', userId).eq('visible', true),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('showcase_nominations').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('endorsements').select('id', { count: 'exact', head: true }).eq('to_user_id', userId)
    ]);

    let score = 0;

    if (profileRes.data) {
        if (profileRes.data.image) score += 50;
        if (profileRes.data.tagline) score += 50;
        if (profileRes.data.name) score += 50;
    }

    if (blocksRes.data && blocksRes.data.length > 0) {
        score += 100;
        const types = blocksRes.data.map(b => b.type);
        score += (types.filter(t => t === 'project').length * 50);
        score += (types.filter(t => t === 'building').length * 30);
        score += (types.filter(t => t === 'writing').length * 20);
        if (types.includes('github') || (profileRes.data && profileRes.data.github_handle)) score += 100;
    }

    score += ((endorsementsRes.count || 0) * 25);
    score += ((nomsRes.count || 0) * 15);
    score += ((followsRes.count || 0) * 10);

    await supabase.from('profiles').update({ builder_score: score }).eq('id', userId);
    return score;
}

syncAllScores();
