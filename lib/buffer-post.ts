// Buffer GraphQL createPost. Used by the avances cron for Instagram and
// LinkedIn. shareNow publishes immediately and does not take a queue slot.
// Missing API key or channel id skips the channel.

import { redactForLog, type ChannelAttempt } from "@/lib/avances-builders";

const BUFFER_ENDPOINT = "https://api.buffer.com";

const CREATE_POST = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess {
        post { id }
      }
      ... on MutationError {
        message
      }
    }
  }
`;

export function bufferChannelConfigured(channelId: string | undefined): boolean {
  return !!process.env.BUFFER_API_KEY && !!channelId;
}

export function parseBufferCreateBody(body: unknown): { ok: true; id: string } | { ok: false; message: string } {
  if (!body || typeof body !== "object") return { ok: false, message: "empty_response" };
  const root = body as {
    errors?: { message?: string }[];
    data?: { createPost?: { post?: { id?: string }; message?: string } | null };
  };
  if (Array.isArray(root.errors) && root.errors.length > 0) {
    const message = root.errors.map((error) => error?.message).filter(Boolean).join("; ");
    return { ok: false, message: message || "graphql_error" };
  }
  const payload = root.data?.createPost;
  if (!payload) return { ok: false, message: "empty_response" };
  const id = payload.post?.id;
  if (typeof id === "string" && id) return { ok: true, id };
  if (typeof payload.message === "string" && payload.message) return { ok: false, message: payload.message };
  return { ok: false, message: "missing_post_id" };
}

export async function createBufferPost(input: {
  channelId: string | undefined;
  text: string;
  image?: { url: string; alt: string };
  instagram?: boolean;
}): Promise<ChannelAttempt> {
  const apiKey = process.env.BUFFER_API_KEY;
  if (!apiKey || !input.channelId) return { status: "skipped_no_config" };

  const variables: Record<string, unknown> = {
    text: input.text,
    channelId: input.channelId,
    schedulingType: "automatic",
    mode: "shareNow",
  };
  if (input.image) {
    variables.assets = [
      {
        image: {
          url: input.image.url,
          metadata: { altText: input.image.alt || "huevsite" },
        },
      },
    ];
  }
  if (input.instagram) {
    variables.metadata = { instagram: { type: "post", shouldShareToFeed: true } };
  }

  try {
    const res = await fetch(BUFFER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: CREATE_POST, variables: { input: variables } }),
      signal: AbortSignal.timeout(20_000),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) return { status: "error", message: `http_${res.status}` };
    const parsed = parseBufferCreateBody(body);
    if (!parsed.ok) return { status: "error", message: redactForLog(parsed.message) };
    return { status: "posted", id: parsed.id };
  } catch (error) {
    return { status: "error", message: redactForLog(error) };
  }
}

export async function publicImageReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    await res.body?.cancel().catch(() => undefined);
    return res.ok;
  } catch {
    return false;
  }
}
