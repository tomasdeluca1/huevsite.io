import { buildUnsubscribeUrl, verifyUnsubscribe, identityFromParts } from "./email-unsubscribe";
import { listUnsubscribeMailto } from "./email-from";

// Gmail/Yahoo bulk-sender headers (RFC 2369 + RFC 8058).
// The HTTPS URI is the one-click POST target. The mailto is the fallback.
export function listUnsubscribeHeaders(
  unsubscribeUrl: string,
  mailto = listUnsubscribeMailto()
): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>, <${mailto}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export function marketingUnsubscribe(userId: string, fromAddress?: string): {
  unsubscribeUrl: string;
  headers: Record<string, string>;
} {
  const unsubscribeUrl = buildUnsubscribeUrl(userId);
  const mailto = fromAddress
    ? `mailto:${fromAddress}?subject=unsubscribe`
    : listUnsubscribeMailto();
  return {
    unsubscribeUrl,
    headers: listUnsubscribeHeaders(unsubscribeUrl, mailto),
  };
}

export function isValidUnsubscribeIdentity(parts: {
  token?: string | null;
  userId?: string | null;
  sig?: string | null;
}): boolean {
  const identity = identityFromParts(parts);
  if (!identity) return false;
  return verifyUnsubscribe(identity.userId, identity.sig);
}
