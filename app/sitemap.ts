import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { BLOG_POSTS } from '@/lib/blog-data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://huevsite.io'
  const now = new Date()

  // Cliente de Supabase anónimo para evitar issues con cookies en build time
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  // Rutas estáticas indexables.
  //
  // Reglas que se respetan acá:
  //  - Solo URLs que devuelven 200. /showcase se sacó porque hace redirect a
  //    /leaderboard: un sitemap lleno de redirects es una señal de calidad
  //    mala y Search Console lo marca como "Página con redirección".
  //  - Solo HTML. /llms.txt y /llms-full.txt salieron: el sitemap es para
  //    páginas indexables, no para archivos de texto (los bots de IA ya los
  //    encuentran vía robots.txt, que los lista explícitamente).
  //  - Las prioridades son relativas entre sí: 1.0 el home, 0.9 los hubs que
  //    generan tráfico orgánico, 0.6-0.7 el long tail, 0.3 lo legal.
  const staticRoutes: MetadataRoute.Sitemap = ([
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/explore`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/linktree`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/leaderboard`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/precios`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/recruiter`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/feed`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/builders-de-la-semana`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/builder-de-la-semana/guia`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/referrals`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ] as const).map((route) => ({ ...route, lastModified: now }))

  // Rutas Dinámicas del Blog
  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  // Perfiles públicos. `updated_at` como lastModified (no `created_at`): le
  // dice a Google cuándo cambió el contenido de verdad, que es lo que decide
  // el re-crawl. Con created_at, un perfil editado ayer parecía intocado
  // desde el alta y se re-indexaba tarde.
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username, created_at, updated_at')
    .not('username', 'is', null)

  const profileRoutes: MetadataRoute.Sitemap = (profiles || [])
    .filter((profile) => profile.username)
    .map((profile) => ({
      url: `${SITE_URL}/${profile.username}`,
      lastModified: new Date(profile.updated_at || profile.created_at || now),
      // 'daily' en miles de perfiles quema crawl budget en páginas que casi
      // nunca cambian. 'weekly' es honesto y deja presupuesto para los hubs.
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  // Sub-sites (/[username]/[slug]): páginas públicas reales que hasta ahora
  // no estaban en el sitemap, o sea que solo se descubrían por link interno.
  let subSiteRoutes: MetadataRoute.Sitemap = []
  try {
    const { data: subSites } = await supabase
      .from('sub_sites')
      .select('slug, created_at, updated_at, profiles!inner(username)')

    subSiteRoutes = (subSites || [])
      .map((subSite: any) => {
        const username = subSite.profiles?.username
        if (!username || !subSite.slug) return null
        return {
          url: `${SITE_URL}/${username}/${subSite.slug}`,
          lastModified: new Date(subSite.updated_at || subSite.created_at || now),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }
      })
      .filter(Boolean) as MetadataRoute.Sitemap
  } catch {
    // Si la relación/tabla no está disponible, el sitemap sigue siendo válido
    // sin los sub-sites — nunca romper el sitemap entero por esto.
  }

  return [...staticRoutes, ...blogRoutes, ...profileRoutes, ...subSiteRoutes]
}
