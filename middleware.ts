import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasProAccess } from '@/lib/pro-access'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // 1. Definir hosts reservados (la plataforma principal)
  const reservedHosts = [
    'huevsite.io',
    'www.huevsite.io',
    'localhost:3000',
    'huevsite-io.vercel.app',
  ]

  // Si termina en .vercel.app es un preview deployment, no lo tratamos como dominio custom
  const isReserved = reservedHosts.some(h => hostname === h) || hostname.endsWith('.vercel.app')

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 2. Lógica de Dominio Custom (Multi-tenant)
  // Solo para usuarios PRO que hayan configurado su dominio
  if (!isReserved) {
    // Si intentan entrar a rutas de sistema por un dominio custom, mandarlos al sitio principal
    const systemPaths = ['/dashboard', '/login', '/welcome', '/onboarding', '/checkout', '/admin']
    if (systemPaths.some(path => url.pathname.startsWith(path))) {
      return NextResponse.redirect(new URL(url.pathname + url.search, 'https://huevsite.io'))
    }

    // No reescribir rutas técnicas de Next.js o la API interna
    if (!url.pathname.startsWith('/_next') && !url.pathname.startsWith('/api') && !url.pathname.startsWith('/static')) {
      // Normalizamos el host para buscarlo (quitar www si existe)
      const possibleDomains = [hostname, hostname.replace(/^www\./, '')];
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, subscription_tier, pro_since, referral_reward_expires_at, free_trial_claimed_at, free_trial_started_at, free_trial_ends_at, free_trial_last_insights_viewed_at')
        .in('custom_domain', possibleDomains)
        .maybeSingle()

      // Verificamos que el perfil exista y sea PRO
      const isPro = profile && hasProAccess(profile)

      if (profile && isPro) {
        // Reescribimos domain.com/path -> huevsite.io/username/path
        return NextResponse.rewrite(new URL(`/${profile.username}${url.pathname}${url.search}`, request.url))
      }
    }
  }

  // 3. Protecciones de la plataforma (Dashboard / Login / Welcome)
  // Estas solo aplican cuando estamos en el dominio principal o si la reescritura no ocurrió
  const isDashboard = url.pathname.startsWith('/dashboard')
  const isLogin = url.pathname.startsWith('/login')

  if (isDashboard && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLogin && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
