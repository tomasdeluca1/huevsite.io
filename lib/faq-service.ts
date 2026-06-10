import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type Faq = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
};

function isMissingTable(error: any) {
  return (
    error &&
    (error.code === "42P01" ||
      error.code === "PGRST205" ||
      /relation .* does not exist|could not find the table/i.test(error.message || ""))
  );
}

// Published FAQs for the landing (visible accordion + JSON-LD). Degrades to []
// if the table isn't migrated yet so the landing never 500s.
export async function getPublishedFaqs(): Promise<Faq[]> {
  try {
    const svc = createServiceRoleClient();
    const { data, error } = await svc
      .from("faqs")
      .select("id, question, answer, sort_order, published")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      if (!isMissingTable(error)) console.error("getPublishedFaqs:", error);
      return [];
    }
    return (data || []) as Faq[];
  } catch (e) {
    console.error("getPublishedFaqs exception:", e);
    return [];
  }
}

// All FAQs for the admin (published + drafts).
export async function getAllFaqs(): Promise<Faq[]> {
  try {
    const svc = createServiceRoleClient();
    const { data, error } = await svc
      .from("faqs")
      .select("id, question, answer, sort_order, published")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      if (!isMissingTable(error)) console.error("getAllFaqs:", error);
      return [];
    }
    return (data || []) as Faq[];
  } catch (e) {
    console.error("getAllFaqs exception:", e);
    return [];
  }
}
