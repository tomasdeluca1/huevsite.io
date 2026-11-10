import { createHash, timingSafeEqual } from "crypto";

export function pkceS256(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function pkceMatches(verifier: string, challenge: string): boolean {
  if (verifier.length < 43 || verifier.length > 128) return false;
  if (!/^[\w\-._~]+$/.test(verifier)) return false;
  const actual = Buffer.from(pkceS256(verifier));
  const expected = Buffer.from(challenge);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
