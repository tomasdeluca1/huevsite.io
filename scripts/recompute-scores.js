require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function recomputeAllScores() {
    console.log('--- Iniciando recalculo de scores ---');

    const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username');

    if (fetchError) {
        console.error('Error al obtener perfiles:', fetchError);
        return;
    }

    console.log(`Procesando ${profiles.length} perfiles...`);

    for (const profile of profiles) {
        console.log(`Calculando para: ${profile.username} (${profile.id})`);
        const { data: newScore, error: rpcError } = await supabase.rpc('recompute_builder_score', {
            target_user_id: profile.id
        });

        if (rpcError) {
            console.error(`  Error en RPC para ${profile.username}:`, rpcError.message);
        } else {
            console.log(`  Nuevo Score: ${newScore}`);
        }
    }

    console.log('--- Fin del proceso ---');
}

recomputeAllScores();
