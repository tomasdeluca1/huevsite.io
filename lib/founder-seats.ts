import { createClient } from "@supabase/supabase-js";

// Founder batch scarcity: the $79 lifetime tier is capped at FOUNDER_SEATS_CAP
// seats, after which the public price moves to $129 (see resolveFounderOffer).
// "Sold" is REAL — counted live from profiles.is_lifetime. That flag is set by
// the Lemon order_created webhook (both the $79 and the $129 variants) AND by
// the admin gift (POST /api/admin/grant-founder), and cleared on order_refunded.
// A gifted Founder therefore occupies a seat. The public counter never lies.
export const FOUNDER_SEATS_CAP = parseInt(process.env.FOUNDER_SEATS_CAP || "20", 10);
export const FOUNDER_NEXT_PRICE = process.env.FOUNDER_NEXT_PRICE || "$129";

export interface FounderSeats {
  cap: number;
  sold: number;
  remaining: number;
}

/** Server-only (service role): live count of lifetime buyers vs the cap. */
export async function getFounderSeats(): Promise<FounderSeats> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_lifetime", true);
    if (error) throw error;
    const sold = count ?? 0;
    return { cap: FOUNDER_SEATS_CAP, sold, remaining: Math.max(0, FOUNDER_SEATS_CAP - sold) };
  } catch (e) {
    console.error("[founder-seats] count failed:", e);
    // Fail open (no counter shown) rather than showing a wrong number.
    return { cap: FOUNDER_SEATS_CAP, sold: 0, remaining: -1 };
  }
}
