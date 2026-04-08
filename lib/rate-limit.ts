/**
 * Simple in-memory rate limiter (no Redis needed).
 * Resets token counts every `interval` milliseconds.
 *
 * Usage:
 *   const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 })
 *   const result = limiter.check(10, identifier) // 10 requests per interval
 *   if (!result.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

interface RateLimitOptions {
  /** Window length in milliseconds */
  interval: number
  /** Max number of unique tokens to track (evicts oldest on overflow) */
  uniqueTokenPerInterval?: number
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // epoch ms when the window resets
}

interface TokenState {
  count: number
  resetAt: number
}

export function rateLimit(options: RateLimitOptions) {
  const { interval, uniqueTokenPerInterval = 500 } = options
  const tokenMap = new Map<string, TokenState>()

  function check(limit: number, token: string): RateLimitResult {
    const now = Date.now()

    // Evict expired entries if map is getting large
    if (tokenMap.size >= uniqueTokenPerInterval) {
      for (const [key, state] of Array.from(tokenMap.entries())) {
        if (now >= state.resetAt) {
          tokenMap.delete(key)
        }
      }
    }

    let state = tokenMap.get(token)

    // First request or window expired — reset
    if (!state || now >= state.resetAt) {
      state = { count: 0, resetAt: now + interval }
      tokenMap.set(token, state)
    }

    state.count += 1

    return {
      success: state.count <= limit,
      limit,
      remaining: Math.max(0, limit - state.count),
      reset: state.resetAt,
    }
  }

  return { check }
}

/**
 * Extract a rate-limit identifier from a request.
 * Uses x-forwarded-for or a fallback.
 */
export function getIdentifier(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return `ip:${ip}`
}
