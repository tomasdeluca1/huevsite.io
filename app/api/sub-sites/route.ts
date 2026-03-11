import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/sub-sites - crear un nuevo sub-site
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        // Solo PRO pueden crear sub-sites
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier, pro_since')
            .eq('id', user.id)
            .single()

        const isPro = profile?.subscription_tier === 'pro' || !!profile?.pro_since

        if (!isPro) {
            return NextResponse.json({ error: 'Necesitas ser PRO para crear sub-sites' }, { status: 403 })
        }

        const { title, slug, description, avatar_url } = await request.json()

        if (!title || !slug) {
            return NextResponse.json({ error: 'Título y slug son requeridos' }, { status: 400 })
        }

        // Validar formato de slug
        const slugRegex = /^[a-z0-9-]+$/
        if (!slugRegex.test(slug)) {
            return NextResponse.json({ error: 'Slug inválido (solo minúsculas, números y guiones)' }, { status: 400 })
        }

        const { data: subSite, error: insertError } = await supabase
            .from('sub_sites')
            .insert({
                user_id: user.id,
                title,
                slug,
                description,
                avatar_url
            })
            .select()
            .single()

        if (insertError) {
            if (insertError.code === '23505') {
                return NextResponse.json({ error: 'Ya tenés un sub-site con ese slug' }, { status: 400 })
            }
            throw insertError
        }

        return NextResponse.json({ success: true, subSite })

    } catch (error: any) {
        console.error('Error creating sub-site:', error)
        return NextResponse.json({ error: error.message || 'Error al crear sub-site' }, { status: 500 })
    }
}

// DELETE /api/sub-sites/[id] - eliminar sub-site (se manejará en route.ts con query param por simplicidad o en carpeta [id])
