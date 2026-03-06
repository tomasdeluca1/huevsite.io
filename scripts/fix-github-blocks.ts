import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseKey) {
    console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY no está configurada en .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchGithubStats(username: string) {
    try {
        console.log(`🔍 Buscando datos para ${username}...`);

        // 1. Datos básicos del usuario
        const userRes = await fetch(`https://api.github.com/users/${username}`);
        if (!userRes.ok) {
            const errorText = await userRes.text();
            console.warn(`⚠️ No se pudo obtener datos de usuario para ${username}: ${userRes.statusText} - ${errorText}`);
            return null;
        }
        const userData = await userRes.json() as any;

        // 2. Repos para contar estrellas
        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
        let stars = 0;
        let reposCount = userData.public_repos || 0;
        let topLanguages: { name: string, percent: number }[] = [];

        if (reposRes.ok) {
            const repos = await reposRes.json() as any[];
            stars = repos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);

            // Calcular lenguajes
            const langCounts: Record<string, number> = {};
            repos.forEach(repo => {
                if (repo.language) {
                    langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
                }
            });

            const totalWithLang = Object.values(langCounts).reduce((a, b) => a + b, 0);
            topLanguages = Object.entries(langCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([name, count]) => ({
                    name,
                    percent: Math.round((count / totalWithLang) * 100)
                }));
        }

        return {
            username: userData.login || username,
            stats: {
                stars,
                repos: reposCount,
                followers: userData.followers || 0,
                topLanguages: topLanguages.length > 0 ? topLanguages : undefined,
                totalCommits: reposCount * 10, // Estimación simple
            },
            showAdvanced: true
        };
    } catch (error) {
        console.error(`❌ Error en fetch para ${username}:`, error);
        return null;
    }
}

async function fixGithubBlocks() {
    console.log("🚀 Iniciando reparación de bloques de GitHub...");

    // 1. Obtener perfiles que tienen github_handle
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, username, github_handle')
        .not('github_handle', 'is', null);

    if (pError || !profiles) {
        console.error("❌ Error al obtener perfiles:", pError);
        return;
    }

    console.log(`📋 Encontrados ${profiles.length} perfiles con handle de GitHub.`);

    for (const profile of profiles) {
        const handle = profile.github_handle!;

        // 2. Buscar si ya tiene un bloque de GitHub
        const { data: blocks, error: bError } = await supabase
            .from('blocks')
            .select('*')
            .eq('user_id', profile.id)
            .eq('type', 'github');

        if (bError) {
            console.error(`❌ Error al buscar bloques para ${profile.username}:`, bError);
            continue;
        }

        const githubBlock = blocks && blocks.length > 0 ? blocks[0] : null;

        // Si el bloque existe y tiene datos (stars > 0 o repos > 0), saltar a menos que el username sea "usuario"
        if (githubBlock && githubBlock.data?.stats?.stars > 0 && githubBlock.data?.username !== 'usuario') {
            console.log(`✅ @${profile.username} ya tiene bloque de GitHub con datos.`);
            continue;
        }

        // 3. Obtener datos de GitHub
        const newGithubData = await fetchGithubStats(handle);
        if (!newGithubData) continue;

        if (githubBlock) {
            // Actualizar bloque existente
            console.log(`🔄 Actualizando bloque de GitHub para @${profile.username}...`);
            const { error: uError } = await supabase
                .from('blocks')
                .update({
                    data: newGithubData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', githubBlock.id);

            if (uError) console.error(`❌ Error al actualizar bloque para ${profile.username}:`, uError);
            else console.log(`✨ @${profile.username} actualizado.`);
        } else {
            // Crear bloque nuevo
            console.log(`➕ Creando bloque de GitHub para @${profile.username}...`);

            // Obtener el orden máximo para ponerlo al final
            const { data: allBlocks } = await supabase
                .from('blocks')
                .select('order')
                .eq('user_id', profile.id)
                .order('order', { ascending: false })
                .limit(1);

            const nextOrder = (allBlocks && allBlocks.length > 0) ? allBlocks[0].order + 1 : 0;

            const { error: iError } = await supabase
                .from('blocks')
                .insert({
                    user_id: profile.id,
                    type: 'github',
                    order: nextOrder,
                    col_span: 1,
                    row_span: 2,
                    data: newGithubData,
                    visible: true
                });

            if (iError) console.error(`❌ Error al insertar bloque para ${profile.username}:`, iError);
            else console.log(`✨ @${profile.username} creado.`);
        }

        // Esperar un poco para no quemar la API de GitHub
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("🏁 Proceso completado.");
}

fixGithubBlocks();
