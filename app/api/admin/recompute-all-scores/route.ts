import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Auth check (simple one for this temp tool)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
