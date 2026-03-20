import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { analyticsService } from '@/lib/analytics-service';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_tier, pro_since")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Insights profile lookup error:", profileError);
      return NextResponse.json({ error: "No se pudo validar el plan" }, { status: 500 });
    }

    const isPro = profile?.subscription_tier === "pro" || !!profile?.pro_since;

    if (!isPro) {
      return NextResponse.json({ error: "Insights es una feature PRO." }, { status: 403 });
    }

    const rangeParam = req.nextUrl.searchParams.get('range');
    const startDate = req.nextUrl.searchParams.get('start');
    const endDate = req.nextUrl.searchParams.get('end');
    const parsedRange = Number(rangeParam);
    const rangeDays = Number.isFinite(parsedRange) && parsedRange > 0 ? Math.min(parsedRange, 365) : 1;

    const insights = await analyticsService.getInsights(user.id, {
      rangeDays,
      startDate,
      endDate,
    });

    return NextResponse.json(insights);
  } catch (error: any) {
    console.error('Insights error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
