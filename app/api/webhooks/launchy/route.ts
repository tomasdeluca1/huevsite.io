import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Inbound webhook from Launchy: stores a launch-status snapshot on the project
// block identified by `ref` (= the huevsite block id). Authenticated by a
// shared secret (x-launchy-secret === LAUNCHY_WEBHOOK_SECRET).
export async function POST(req: Request) {
  const secret = req.headers.get("x-launchy-secret");
  if (!process.env.LAUNCHY_WEBHOOK_SECRET || secret !== process.env.LAUNCHY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    ref?: string;
    launchyProductId?: string;
    total?: number;
    live?: number;
    submitted?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { ref, launchyProductId, total, live, submitted } = body;
  if (
    !ref ||
    typeof total !== "number" ||
    typeof live !== "number" ||
    typeof submitted !== "number"
  ) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  const { data: block, error: readErr } = await admin
    .from("blocks")
    .select("id, type, data")
    .eq("id", ref)
    .single();

  if (readErr || !block) {
    return NextResponse.json({ error: "block not found" }, { status: 404 });
  }
  if (block.type !== "project") {
    return NextResponse.json({ error: "not a project block" }, { status: 409 });
  }

  const newData = {
    ...((block.data as Record<string, unknown>) || {}),
    launch: {
      productId: launchyProductId ?? null,
      total,
      live,
      submitted,
      updatedAt: new Date().toISOString(),
    },
  };

  const { error: writeErr } = await admin.from("blocks").update({ data: newData }).eq("id", ref);
  if (writeErr) {
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
