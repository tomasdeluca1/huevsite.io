import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

// Browser client built with @supabase/ssr so auth state — including the PKCE
// code verifier — is stored in COOKIES, shared with the server callback
// (lib/supabase/server.ts) and middleware (both already use @supabase/ssr).
// The previous plain @supabase/supabase-js client kept the verifier in
// localStorage, which the cookie-reading server callback could not see —
// causing "couldn't validate session" on Safari/iOS and other contexts where
// the localStorage/cookie split broke the code exchange. createBrowserClient
// is API-compatible (.from/.auth/...), so existing consumers are unchanged.
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
