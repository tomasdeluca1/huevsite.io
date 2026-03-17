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

async function initializeOnboardingAndCredits() {
    console.log("🚀 Iniciando inicialización de créditos y flags...");

    // 1. Update credits for PRO users
    console.log("💎 Actualizando créditos para usuarios PRO...");
    const { error: proError } = await supabase
        .from('profiles')
        .update({ ai_credits: 30 })
        .or('subscription_tier.eq.pro,pro_since.not.is.null');

    if (proError) {
        console.error("❌ Error actualizando usuarios PRO:", proError);
    } else {
        console.log("✅ Usuarios PRO actualizados a 30 créditos.");
    }

    // 2. Update credits for FREE users
    console.log("🥚 Actualizando créditos para usuarios FREE...");
    const { error: freeError } = await supabase
        .from('profiles')
        .update({ ai_credits: 2 })
        .eq('subscription_tier', 'free')
        .is('pro_since', null);

    if (freeError) {
        console.error("❌ Error actualizando usuarios FREE:", freeError);
    } else {
        console.log("✅ Usuarios FREE actualizados a 2 créditos.");
    }

    // 3. Set onboarding flag for 'huevsite'
    console.log("🎯 Habilitando onboarding para el usuario 'huevsite'...");
    const { error: flagError } = await supabase
        .from('profiles')
        .update({ is_onboarding_test_user: true })
        .eq('username', 'huevsite');

    if (flagError) {
        console.error("❌ Error habilitando flag para 'huevsite':", flagError);
        console.log("ℹ️ Nota: Si el error es 'column does not exist', asegurate de correr la migración SQL primero.");
    } else {
        console.log("✅ Flag habilitada para 'huevsite'.");
    }

    console.log("✨ Proceso finalizado.");
}

initializeOnboardingAndCredits();
