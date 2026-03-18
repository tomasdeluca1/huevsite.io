import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/sub-sites/[id]/blocks - obtener bloques de un sub-site
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const { id } = params

        const { data: blocks, error: blocksError } = await supabase
            .from('blocks')
            .select('*')
            .eq('user_id', user.id)
            .eq('sub_site_id', id)
            .order('order', { ascending: true })

        if (blocksError) throw blocksError

        const { data: subSite } = await supabase
            .from('sub_sites')
            .select('avatar_url')
            .eq('id', id)
            .eq('user_id', user.id)
            .maybeSingle()

        const normalizedBlocks = (blocks || []).map((block: any) => {
            if (block.type !== 'hero') return block
            return {
                ...block,
                data: {
                    ...(block.data || {}),
                    avatarUrl: subSite?.avatar_url || "",
                }
            }
        })

        return NextResponse.json({ blocks: normalizedBlocks })

    } catch (error: any) {
        console.error('Error fetching sub-site blocks:', error)
        return NextResponse.json({ error: error.message || 'Error al obtener bloques' }, { status: 500 })
    }
}
