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
// PATCH /api/sub-sites/[id] - actualizar un sub-site
export async function PATCH(
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
        const updates = await request.json()
        
        // Construir objeto de actualización dinámicamente
        const updateData: any = {
            updated_at: new Date().toISOString()
        }

        if (updates.title !== undefined) updateData.title = updates.title
        if (updates.slug !== undefined) updateData.slug = updates.slug
        if (updates.description !== undefined) updateData.description = updates.description
        if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url

        // Actualizar sub-site
        let { data: subSite, error: updateError } = await supabase
            .from('sub_sites')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        // Fallback si la columna avatar_url falla por no estar en el cache
        if (updateError && (updateError as any).code === 'PGRST204' && updateData.avatar_url !== undefined) {
            const fallbackData = { ...updateData }
            delete fallbackData.avatar_url
            
            const { data: secondAttempt, error: secondError } = await supabase
                .from('sub_sites')
                .update(fallbackData)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single()
            
            subSite = secondAttempt
            updateError = secondError
        }

        if (updateError) throw updateError

        return NextResponse.json({ success: true, subSite })

    } catch (error: any) {
        console.error('Error updating sub-site:', error)
        return NextResponse.json({ error: error.message || 'Error al actualizar sub-site' }, { status: 500 })
    }
}
