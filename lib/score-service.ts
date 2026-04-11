import { createClient } from '@supabase/supabase-js';

// recompute_builder_score is restricted to service_role since the
// security hardening pass (2026-04-11). The RPC needs to recompute scores
// for OTHER users (e.g. after an endorsement is granted), which can't be
// safely expressed as `auth.uid() = target_user_id`. We trust the
// application logic to only call this from server routes that have already
// validated the operation that triggered the recomputation.

function getServiceRoleClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export const scoreService = {
    /**
     * Recalcula el Builder Score para un usuario específico llamando a la función RPC en Postgres
     */
    async recomputeScore(userId: string): Promise<number> {
        const supabase = getServiceRoleClient();

        const { data, error } = await supabase.rpc('recompute_builder_score', {
            target_user_id: userId
        });

        if (error) {
            console.error('Error al recalcular score via RPC:', error);
            // Si el RPC falla (ej: aún no se corrió el script en supabase), devolvemos 0 o el valor previo
            return 0;
        }

        return data as number;
    }
};
