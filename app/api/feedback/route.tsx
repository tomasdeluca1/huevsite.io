import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { FeedbackEmail } from "@/components/emails/FeedbackEmail";

function getServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  return profile?.username === 'tomi_delu';
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { content, category = 'general', screenshotUrl = null } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "El contenido es requerido" }, { status: 400 });
    }

    // 1. Guardar en Base de Datos
    const { error: dbError } = await supabase
      .from("feedbacks")
      .insert({
        user_id: user.id,
        user_email: user.email,
        content,
        category,
        screenshot_url: screenshotUrl
      });

    if (dbError) {
      console.error("Database error saving feedback:", dbError);
      return NextResponse.json({ error: "Error al guardar en base de datos" }, { status: 500 });
    }

    // 2. Enviar email si hay API Key de Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: "tomasdelucaa@gmail.com",
          subject: `🚀 Nuevo Feedback: ${category}`,
          react: <FeedbackEmail
            userEmail={user.email || 'Anónimo'}
            category={category}
            content={content}
            userId={user.id}
            screenshotUrl={screenshotUrl || undefined}
          />,
        });
      } catch (emailError) {
        console.error("Resend email error:", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Internal feedback error:", error);
    return NextResponse.json({ error: "Algo salió mal" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("feedbacks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const supabase = getServiceRoleClient();
    const { error } = await supabase.from("feedbacks").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id, status } = await req.json();

    if (!id || !status) return NextResponse.json({ error: "ID y status requeridos" }, { status: 400 });

    const supabase = getServiceRoleClient();
    const { error } = await supabase.from("feedbacks").update({ status }).eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
