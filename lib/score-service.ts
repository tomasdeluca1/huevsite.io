import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Ignorar errores de cookies en server components
                    }
                },
            },
        }
    );
}

export const scoreService = {
    /**
     * Recalcula el Builder Score para un usuario específico llamando a la función RPC en Postgres
     */
    async recomputeScore(userId: string): Promise<number> {
        const supabase = await getServerClient();

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
