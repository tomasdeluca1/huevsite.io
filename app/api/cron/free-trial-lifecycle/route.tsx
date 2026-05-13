import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Cron disabled: lifecycle emails were spamming inboxes (multiple trial
// profiles sharing one email kept slipping past the dedup — one inbox got
// the "expired" mail 22 times). Schedule removed from vercel.json. Route
// kept as a no-op so an admin-secret call can't reactivate the blast by
// mistake. Implementation lives in git history if we want to revive it.
export async function GET() {
  return NextResponse.json({ success: true, disabled: true });
}
