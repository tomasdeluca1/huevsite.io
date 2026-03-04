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

// Versión modificada para usar service role con lógica mejorada v2
async function recomputeWithServiceRole(userId: string): Promise<number> {
    const [profileRes, blocksRes, followsRes, nomsRes, endorsementsRes, nomsGivenRes, endorsementsGivenRes] = await Promise.all([
        supabase.from('profiles').select('name, tagline, image, github_handle, pro_since, updated_at').eq('id', userId).single(),
        supabase.from('blocks').select('type, data').eq('user_id', userId).eq('visible', true),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('showcase_nominations').select('id', { count: 'exact', head: true }).eq('user_id', userId), // recibidas
        supabase.from('endorsements').select('id', { count: 'exact', head: true }).eq('to_id', userId), // recibidos
        supabase.from('showcase_nominations').select('id', { count: 'exact', head: true }).eq('nominated_by', userId), // dadas
        supabase.from('endorsements').select('id', { count: 'exact', head: true }).eq('from_id', userId) // dados
    ]);

    let score = 0;

    // A. Completitud base (Max 100)
    if (profileRes.data) {
        if (profileRes.data.image) score += 33;
        if (profileRes.data.name) score += 33;

        // Calidad de tagline (min 10 chars)
        const tagline = profileRes.data.tagline;
        if (tagline && tagline.length > 10) {
            score += 34;
        } else if (tagline && tagline.length > 0) {
            score += 10;
        }
    }

    // B. Bloques con Diminishing Returns
    if (blocksRes.data && blocksRes.data.length > 0) {
        let projects = 0, buildings = 0, writings = 0;

        for (const block of blocksRes.data) {
            if (block.type === 'project') {
                projects++;
                if (projects <= 3) score += 75;
                else if (projects <= 6) score += 30;
                else score += 5;
            } else if (block.type === 'building') {
                buildings++;
                if (buildings <= 3) score += 30;
                else score += 10;
            } else if (block.type === 'writing') {
                writings++;
                if (writings <= 3) score += 20;
                else score += 5;
            }
        }

        // Bonus GitHub: Conectado o bloque activo (+150)
        const hasGithubBlock = blocksRes.data.some(b => b.type === 'github');
        if (hasGithubBlock || (profileRes.data && profileRes.data.github_handle)) {
            score += 150;
        }
    }

    // C. Social (Recibido)
    score += ((endorsementsRes.count || 0) * 25);
    score += ((nomsRes.count || 0) * 15);
    score += ((followsRes.count || 0) * 10);

    // D. Reciprocidad Social (Dada) - Max 150 por endorsements, Max 100 por noms
    const endorsementsGiven = endorsementsGivenRes.count || 0;
    const nomsGiven = nomsGivenRes.count || 0;
    score += (Math.min(endorsementsGiven, 10) * 15);
    score += (Math.min(nomsGiven, 5) * 20);

    // E. Freshness (+50 si actualizó en los últimos 30 días)
    if (profileRes.data?.updated_at) {
        const lastUpdate = new Date(profileRes.data.updated_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (lastUpdate > thirtyDaysAgo) {
            score += 50;
        }
    }

    // F. Pro Bonus (+100)
    if (profileRes.data?.pro_since) {
        score += 100;
    }

    await supabase.from('profiles').update({ builder_score: score }).eq('id', userId);
    return score;
}

syncAllScores();
