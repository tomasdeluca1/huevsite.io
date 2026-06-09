import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type LandingTestimonial = {
  id: string;
  quote: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

export type OwnTestimonial = {
  quote: string;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
} | null;

export type AdminTestimonial = {
  id: string;
  quote: string;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  created_at: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

// PostgREST / Postgres signal that the table hasn't been migrated yet — degrade
// gracefully (the landing must not 500 if the migration isn't applied).
function isMissingTable(error: any) {
  return (
    error &&
    (error.code === "42P01" ||
      error.code === "PGRST205" ||
      /relation .* does not exist|could not find the table/i.test(error.message || ""))
  );
}

const MAX_QUOTE = 280;

// Approved + featured testimonials for the landing, joined to FRESH profile data.
export async function getFeaturedTestimonials(): Promise<LandingTestimonial[]> {
  try {
    const svc = createServiceRoleClient();
    const { data, error } = await svc
      .from("testimonials")
      .select(
        "id, quote, user:profiles!testimonials_user_id_fkey(username, name, image)"
      )
      .eq("status", "approved")
      .eq("featured", true)
      .order("featured_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) {
      if (!isMissingTable(error)) console.error("getFeaturedTestimonials:", error);
      return [];
    }
    return (data || [])
      .map((r: any) =>
        r.user
          ? {
              id: r.id,
              quote: r.quote,
              name: r.user.name || r.user.username,
              username: r.user.username,
              avatarUrl: r.user.image,
            }
          : null
      )
      .filter(Boolean) as LandingTestimonial[];
  } catch (e) {
    console.error("getFeaturedTestimonials exception:", e);
    return [];
  }
}

// The logged-in user's own testimonial (for the /testimonio prefill + status).
export async function getUserTestimonial(userId: string): Promise<OwnTestimonial> {
  try {
    const svc = createServiceRoleClient();
    const { data, error } = await svc
      .from("testimonials")
      .select("quote, status, featured")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      if (!isMissingTable(error)) console.error("getUserTestimonial:", error);
      return null;
    }
    return (data as OwnTestimonial) ?? null;
  } catch {
    return null;
  }
}

// Insert or replace the user's testimonial. Any submit/edit goes back to
// 'pending' and clears 'featured' so it re-passes moderation before showing.
export async function upsertTestimonial(
  userId: string,
  rawQuote: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const quote = (rawQuote || "").trim();
  if (!quote) return { ok: false, error: "El testimonio no puede estar vacío." };
  if (quote.length > MAX_QUOTE)
    return { ok: false, error: `Máximo ${MAX_QUOTE} caracteres.` };

  try {
    const svc = createServiceRoleClient();
    const { error } = await svc.from("testimonials").upsert(
      {
        user_id: userId,
        quote,
        status: "pending",
        featured: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) {
      console.error("upsertTestimonial:", error);
      return { ok: false, error: "No se pudo guardar. Probá de nuevo." };
    }
    return { ok: true };
  } catch (e) {
    console.error("upsertTestimonial exception:", e);
    return { ok: false, error: "Error de servidor." };
  }
}

// Admin: all testimonials (pending first), joined to profile data.
export async function getAllTestimonialsForAdmin(): Promise<AdminTestimonial[]> {
  try {
    const svc = createServiceRoleClient();
    const { data, error } = await svc
      .from("testimonials")
      .select(
        "id, quote, status, featured, created_at, user:profiles!testimonials_user_id_fkey(username, name, image)"
      )
      .order("created_at", { ascending: false });
    if (error) {
      if (!isMissingTable(error)) console.error("getAllTestimonialsForAdmin:", error);
      return [];
    }
    const rows = (data || []).map((r: any) => ({
      id: r.id,
      quote: r.quote,
      status: r.status,
      featured: r.featured,
      created_at: r.created_at,
      name: r.user?.name || r.user?.username || "—",
      username: r.user?.username || "",
      avatarUrl: r.user?.image ?? null,
    })) as AdminTestimonial[];
    // pending first, then the rest by recency (already date-desc within groups)
    const rank = (s: string) => (s === "pending" ? 0 : s === "approved" ? 1 : 2);
    return rows.sort((a, b) => rank(a.status) - rank(b.status));
  } catch (e) {
    console.error("getAllTestimonialsForAdmin exception:", e);
    return [];
  }
}
