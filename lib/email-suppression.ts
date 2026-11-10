import { findUserIdByEmail } from "./find-user-by-email";
import { unsubscribeFromBeehiiv } from "./beehiiv";
import type { SuppressionReason } from "./resend-webhook";

type SupabaseLike = {
  from: (table: string) => any;
  auth?: { admin?: { getUserById?: (id: string) => Promise<any> } };
};

export function isEmailSuppressed(
  suppressed: Set<string>,
  email: string | null | undefined
): boolean {
  const value = (email || "").trim().toLowerCase();
  return !!value && suppressed.has(value);
}

/**
 * Addresses Resend reported as bounced or complained.
 * If the table is missing (migration not applied yet) this logs and returns
 * an empty set so a send is not blocked before the SQL is run.
 */
export async function listSuppressedEmails(supabase: SupabaseLike): Promise<Set<string>> {
  const out = new Set<string>();
  const pageSize = 1000;
  try {
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from("email_suppressions")
        .select("email")
        .range(from, from + pageSize - 1);
      if (error) {
        console.error("[email-suppression] load failed:", error.message);
        return out;
      }
      const batch = data || [];
      for (const row of batch) {
        const email = String(row.email || "").trim().toLowerCase();
        if (email) out.add(email);
      }
      if (batch.length < pageSize) break;
    }
  } catch (err) {
    console.error("[email-suppression] load threw:", err);
  }
  return out;
}

/**
 * Remember a bad address and, when we can resolve the user, opt them out of
 * community mail. A complaint is not downgraded to a later bounce.
 * Beehiiv is best-effort: a missing key or a Beehiiv error is logged only.
 */
export async function recordEmailSuppression(
  supabase: SupabaseLike,
  email: string,
  reason: SuppressionReason
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;

  const { data: existing, error: readError } = await supabase
    .from("email_suppressions")
    .select("reason")
    .eq("email", normalized)
    .maybeSingle();
  if (readError) throw readError;

  const keepComplaint = existing?.reason === "complained" && reason === "bounced";
  if (!keepComplaint) {
    const { error } = await supabase.from("email_suppressions").upsert(
      {
        email: normalized,
        reason,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );
    if (error) throw error;
  }

  try {
    const userId = await findUserIdByEmail(supabase, normalized);
    if (userId) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ community_digest_unsubscribed: true })
        .eq("id", userId);
      if (profileError) {
        console.error("[email-suppression] profile flag failed:", profileError.message);
      }
    }
  } catch (err) {
    console.error("[email-suppression] user lookup failed:", err);
  }

  try {
    const result = await unsubscribeFromBeehiiv(normalized);
    if (!result.ok) {
      console.warn("[email-suppression] beehiiv:", result.error);
    }
  } catch (err) {
    console.error("[email-suppression] beehiiv threw:", err);
  }
}
