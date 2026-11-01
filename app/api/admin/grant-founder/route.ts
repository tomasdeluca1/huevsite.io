import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import { getFounderSeats } from "@/lib/founder-seats";
import { scoreService } from "@/lib/score-service";

export const dynamic = "force-dynamic";

function normalizeUsername(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^@+/, "").toLowerCase();
}

/**
 * POST /api/admin/grant-founder { username }
 * Otorga Founder lifetime (is_lifetime + Pro) a un perfil. Cuenta en el cupo
 * porque el cupo es count(profiles.is_lifetime). Idempotente: si ya es
 * Founder, no pisa pro_since ni suma otro lugar.
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminClient(request);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const username = normalizeUsername(body?.username);
  if (!username) {
    return NextResponse.json({ error: "Falta el username." }, { status: 400 });
  }

  const { data: profile, error: findError } = await admin
    .from("profiles")
    .select("id, username, is_lifetime, pro_since")
    .eq("username", username)
    .maybeSingle();

  if (findError) {
    console.error("[grant-founder] lookup:", findError.message);
    return NextResponse.json({ error: "No se pudo buscar el perfil." }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ error: "No encontramos una cuenta con ese username." }, { status: 404 });
  }

  if (profile.is_lifetime) {
    const seats = await getFounderSeats();
    return NextResponse.json({
      ok: true,
      already: true,
      username: profile.username,
      seats,
    });
  }

  const patch: Record<string, unknown> = {
    is_lifetime: true,
    subscription_tier: "pro",
  };
  if (!profile.pro_since) patch.pro_since = new Date().toISOString();

  const { error: updateError } = await admin.from("profiles").update(patch).eq("id", profile.id);
  if (updateError) {
    console.error("[grant-founder] update:", updateError.message);
    return NextResponse.json({ error: "No se pudo otorgar Founder." }, { status: 500 });
  }

  try {
    await scoreService.recomputeScore(profile.id);
  } catch (e) {
    console.error("[grant-founder] score (non-fatal):", e);
  }

  try {
    await admin.from("activities").insert({
      user_id: profile.id,
      type: "founder_gift",
      data: { source: "admin", username: profile.username },
    });
  } catch (e) {
    console.error("[grant-founder] activity (non-fatal):", e);
  }

  const seats = await getFounderSeats();
  return NextResponse.json({
    ok: true,
    already: false,
    username: profile.username,
    seats,
  });
}
