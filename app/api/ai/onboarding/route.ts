import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
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

    const { name } = await req.json();

    // 1. Check credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_credits')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.ai_credits ?? 0) <= 0) {
      return NextResponse.json({ error: 'Sin créditos' }, { status: 403 });
    }

    // 2. Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Genera un tagline corto y creativo para un perfil de huevsite.io. 
    Nombre del usuario: ${name}. 
    El tagline debe sonar profesional pero moderno, estilo 'builder'. 
    Ejemplos: 
    - Fullstack Dev buildeando el futuro
    - Diseñador UI/UX enfocado en productos digitales
    - Creando herramientas para la comunidad
    
    Responde UNICAMENTE con el texto del tagline, sin comillas ni explicaciones.`;

    const result = await model.generateContent(prompt);
    const tagline = result.response.text().trim();

    // 3. Deduct credit
    await supabase
      .from('profiles')
      .update({ ai_credits: (profile.ai_credits ?? 0) - 1 })
      .eq('id', user.id);

    return NextResponse.json({ tagline });

  } catch (error) {
    console.error('AI Onboarding error:', error);
    return NextResponse.json({ error: 'Error procesando IA' }, { status: 500 });
  }
}
