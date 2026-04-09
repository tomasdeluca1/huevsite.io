const TYPEFULLY_API_BASE = "https://api.typefully.com/v1";

interface CreateDraftResponse {
  id: number;
  text_first_tweet: string;
  num_tweets: number;
}

export async function createTypefullyDraft(content: string): Promise<CreateDraftResponse> {
  const apiKey = process.env.TYPEFULLY_API_KEY;
  if (!apiKey) throw new Error("TYPEFULLY_API_KEY not configured");

  const res = await fetch(`${TYPEFULLY_API_BASE}/drafts/`, {
    method: "POST",
    headers: {
      "X-API-KEY": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
      threadify: false,
      share: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Typefully API error ${res.status}: ${text}`);
  }

  return res.json();
}

export function getTypefullyDraftUrl(draftId: number): string {
  return `https://typefully.com/drafts/${draftId}`;
}
