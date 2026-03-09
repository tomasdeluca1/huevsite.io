import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// DELETE /api/sub-sites/[id] - eliminar un sub-site
export async function DELETE(
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

        // Eliminar sub-site (RLS se encargará de validar que sea del usuario)
        const { error: deleteError } = await supabase
            .from('sub_sites')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (deleteError) throw deleteError

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Error deleting sub-site:', error)
        return NextResponse.json({ error: error.message || 'Error al eliminar sub-site' }, { status: 500 })
    }
}
