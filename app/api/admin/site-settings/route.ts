import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import { getSiteSettings } from "@/lib/site-settings-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await getAdminClient(request);
  if (!supabase) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

// Upsert one or more key/value settings: { settings: { key: value, ... } }.
export async function POST(request: NextRequest) {
  const supabase = await getAdminClient(request);
  if (!supabase) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const incoming = body?.settings;
  if (!incoming || typeof incoming !== "object") {
    return NextResponse.json({ error: "settings inválido." }, { status: 400 });
  }

  const rows = Object.entries(incoming)
    .filter(([k]) => typeof k === "string" && k.length > 0)
    .map(([key, value]) => ({
      key,
      value: value == null ? null : String(value),
      updated_at: new Date().toISOString(),
    }));

  if (rows.length === 0) {
    return NextResponse.json({ error: "Sin cambios." }, { status: 400 });
  }

  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
