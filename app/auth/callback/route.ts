import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('// Auth Callback Triggered');
  console.log('// Code present:', !!code);

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
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
