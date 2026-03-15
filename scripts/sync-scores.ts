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
    console.log("🚀 Iniciando recalculo de scores para todos los usuarios via RPC...");

    // Obtenemos todos los IDs
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username');

    if (error || !profiles) {
        console.error("❌ Error al obtener perfiles:", error);
        return;
    }

    console.log(`📋 Encontrados ${profiles.length} usuarios.`);

    // Procesamos en lotes de 10 en paralelo para no saturar pero terminar rápido
    const BATCH_SIZE = 10;
    for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
        const batch = profiles.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (profile) => {
            try {
                const { data: newScore, error: rpcError } = await supabase.rpc('recompute_builder_score', {
                    target_user_id: profile.id
                });
                
                if (rpcError) throw rpcError;
                console.log(`✅ @${profile.username}: ${newScore} pts`);
            } catch (err) {
                console.error(`❌ Error con @${profile.username}:`, err);
            }
        }));
    }

    console.log("✨ Sincronización completada.");
}

syncAllScores();
