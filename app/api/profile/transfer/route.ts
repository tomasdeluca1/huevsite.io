import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for transfer
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    // Get current user (sender)
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    // 1. Encontrar el usuario destino por email
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json({ 
        error: 'El usuario destino no existe en huevsite. Pedile que se registre primero.' 
      }, { status: 404 });
    }

    if (targetProfile.id === currentUser.id) {
      return NextResponse.json({ error: 'No podés transferirte a vos mismo' }, { status: 400 });
    }

    // 2. Transferir sub-sites
    const { error: subSiteError } = await supabase
      .from('sub_sites')
      .update({ user_id: targetProfile.id })
      .eq('user_id', currentUser.id);

    if (subSiteError) throw subSiteError;

    // 3. Transferir bloques
    const { error: blockError } = await supabase
      .from('blocks')
      .update({ user_id: targetProfile.id })
      .eq('user_id', currentUser.id);

    if (blockError) throw blockError;

    // Opcional: Transferir custom_domain, accent_color, etc?
    // User dijo "transferir el board". En huevsite el board es el contenido.
    // Copiamos la configuración estética del perfil también.
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('accent_color, tagline, name, image')
      .eq('id', currentUser.id)
      .single();

    if (currentProfile) {
       await supabase
        .from('profiles')
        .update({
          accent_color: currentProfile.accent_color,
          tagline: currentProfile.tagline,
          name: currentProfile.name,
          image: currentProfile.image,
        })
        .eq('id', targetProfile.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Transfer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
