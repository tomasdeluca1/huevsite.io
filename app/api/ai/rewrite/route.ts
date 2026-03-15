import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { aiService } from '@/lib/ai-service';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for credit updates
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text || text.length < 5) {
      return NextResponse.json({ error: 'Texto muy corto para reescribir' }, { status: 400 });
    }

    // 1. Verificar créditos y pro status
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_credits, is_pro')
      .eq('id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });

    const credits = profile.ai_credits ?? 0;
    if (credits <= 0) {
      return NextResponse.json({ 
        error: 'No tenés créditos de IA. ' + (profile.is_pro ? 'Se renovarán el próximo mes.' : 'Pasate a PRO para obtener 30 por mes.')
      }, { status: 403 });
    }

    // 2. Llamar a la IA
    const variations = await aiService.rewriteText(text);

    // 3. Descontar crédito
    await supabase
      .from('profiles')
      .update({ ai_credits: credits - 1 })
      .eq('id', user.id);

    return NextResponse.json({ 
      variations, 
      remainingCredits: credits - 1 
    });
  } catch (error: any) {
    console.error('AI Rewrite error:', error);
    return NextResponse.json({ error: 'Error procesando tu pedido' }, { status: 500 });
  }
}
