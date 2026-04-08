/**
 * Environment variable validation.
 * This module checks required env vars at import time and throws
 * a clear error with the variable name if any are missing.
 */

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    if (isBuildTime) {
      return '';
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// ─── Supabase (public) ────────────────────────────────────────────────────────
export const NEXT_PUBLIC_SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
export const NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY');

// ─── Supabase (server-only) ───────────────────────────────────────────────────
export const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

// ─── Site URL ─────────────────────────────────────────────────────────────────
export const NEXT_PUBLIC_SITE_URL = requireEnv('NEXT_PUBLIC_SITE_URL');

// ─── LemonSqueezy ─────────────────────────────────────────────────────────────
export const LEMON_SQUEEZY_API_KEY = requireEnv('LEMON_SQUEEZY_API_KEY');
export const LEMON_SQUEEZY_STORE_ID = requireEnv('LEMON_SQUEEZY_STORE_ID');
export const LEMON_SQUEEZY_PRO_VARIANT_ID = requireEnv('LEMON_SQUEEZY_PRO_VARIANT_ID');
export const LEMON_SQUEEZY_WEBHOOK_SECRET = requireEnv('LEMON_SQUEEZY_WEBHOOK_SECRET');

// ─── Resend ───────────────────────────────────────────────────────────────────
export const RESEND_API_KEY = requireEnv('RESEND_API_KEY');

// ─── Vercel ───────────────────────────────────────────────────────────────────
export const VERCEL_TOKEN = requireEnv('VERCEL_TOKEN');
export const VERCEL_PROJECT_ID = requireEnv('VERCEL_PROJECT_ID');
export const VERCEL_TEAM_ID = requireEnv('VERCEL_TEAM_ID');

// ─── Twitter ──────────────────────────────────────────────────────────────────
export const TWITTER_API_KEY = requireEnv('TWITTER_API_KEY');
export const TWITTER_API_SECRET = requireEnv('TWITTER_API_SECRET');
export const TWITTER_ACCESS_TOKEN = requireEnv('TWITTER_ACCESS_TOKEN');
export const TWITTER_ACCESS_SECRET = requireEnv('TWITTER_ACCESS_SECRET');

// ─── AI ───────────────────────────────────────────────────────────────────────
export const GEMINI_API_KEY = requireEnv('GEMINI_API_KEY');
export const OPENAI_API_KEY = requireEnv('OPENAI_API_KEY');

// ─── Admin / Cron ─────────────────────────────────────────────────────────────
export const ADMIN_SECRET = requireEnv('ADMIN_SECRET');
export const CRON_SECRET = requireEnv('CRON_SECRET');
