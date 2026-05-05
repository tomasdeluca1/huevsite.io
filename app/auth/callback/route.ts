import { createClient } from '@/lib/supabase/server'
import { subscribeToBeehiiv } from '@/lib/beehiiv'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('// Auth Callback Triggered');
  console.log('// Code present:', !!code);

  if (code) {
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        // Sync the authed user's email to beehiiv only if they have the
        // newsletter_subscribed flag set on their profile. New signups
        // default to TRUE (per privacy policy mayo 2026); pre-existing
        // users were backfilled to FALSE and must opt in from the
        // dashboard. Beehiiv 422s repeats so this stays idempotent on
        // re-login. Fire-and-forget: never delay the auth redirect.
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.email) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('newsletter_subscribed')
              .eq('id', user.id)
              .maybeSingle()
            if (profile?.newsletter_subscribed) {
              subscribeToBeehiiv({
                email: user.email,
                utmSource: 'huevsite-io',
                utmCampaign: 'oauth-login',
              }).catch((err) => console.error('// beehiiv sync:', err))
            }
          }
        } catch (err) {
          console.error('// beehiiv sync getUser failed:', err)
        }

        console.log('// Auth Exchange Success -> Redirecting to', next);
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.error('// Auth Exchange Error:', error.message);
      }
    } catch (e) {
      console.error('// Auth unexpected error:', e);
    }
  } else {
    console.warn('// No code found in callback URL');
  }

  // Si algo falla, lo mandamos al login de nuevo
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
