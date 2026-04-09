import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_USERNAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Auth check (simple one for this temp tool)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Admin check
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();

        if (profile?.username !== ADMIN_USERNAME) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data: profiles, error } = await supabase
            .from("profiles")
            .select("id");

        if (error) throw error;

        const results = [];
        for (const profile of profiles) {
            const { data: score, error: rpcError } = await supabase.rpc("recompute_builder_score", {
                target_user_id: profile.id,
            });

            results.push({
                id: profile.id,
                score: score,
                error: rpcError ? rpcError.message : null
            });
        }

        return NextResponse.json({
            success: true,
            processed: profiles.length,
            results
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
