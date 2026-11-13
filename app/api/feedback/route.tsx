import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { FeedbackEmail } from "@/components/emails/FeedbackEmail";
import { emailFrom, emailReplyTo } from "@/lib/email-from";
import { feedbackPageUrl, feedbackPlan, scheduleFeedbackWebhook } from "@/lib/feedback-webhook";

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

type FeedbackActor = {
  username?: string | null;
  subscription_tier?: string | null;
  is_lifetime?: boolean | null;
};

async function loadFeedbackActor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<FeedbackActor | null> {
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = getServiceRoleClient();
      const { data, error } = await admin
        .from("profiles")
        .select("username, subscription_tier, is_lifetime")
        .eq("id", userId)
        .maybeSingle();
      if (!error) return data;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("username, subscription_tier")
      .eq("id", userId)
      .maybeSingle();
    if (!error) return data;
  } catch {
    // Logged below. The forward still goes out with plan "unknown".
  }

  console.error("[feedback-webhook] profile lookup failed");
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { content, category = 'general', screenshotUrl = null, pageUrl = null } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "El contenido es requerido" }, { status: 400 });
    }

    const feedbackId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // 1. Guardar en Base de Datos. El id y created_at se fijan acá: el usuario
    // no puede hacer SELECT de su fila (RLS), y el webhook necesita ambos.
    const { error: dbError } = await supabase
      .from("feedbacks")
      .insert({
        id: feedbackId,
        created_at: createdAt,
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

    // 2. Enviar email si hay API Key de Resend y NOTIFY_EMAIL configurado
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        if (process.env.NOTIFY_EMAIL) {
          await resend.emails.send({
            from: emailFrom(),
            replyTo: emailReplyTo(),
            to: process.env.NOTIFY_EMAIL || "",
            subject: `🚀 Nuevo Feedback: ${category}`,
            react: <FeedbackEmail
              userEmail={user.email || 'Anónimo'}
              category={category}
              content={content}
              userId={user.id}
              screenshotUrl={screenshotUrl || undefined}
            />,
          });
        }
      } catch (emailError) {
        console.error("Resend email error:", emailError);
      }
    }

    // 3. Reenviar al webhook, después de guardar y del mail. No bloquea la
    // respuesta: waitUntil mantiene el POST (timeout 5s) y un fallo solo se loguea.
    const page_url = feedbackPageUrl(pageUrl) ?? feedbackPageUrl(req.headers.get("referer"));
    const message = typeof content === "string" ? content : String(content);
    scheduleFeedbackWebhook(async () => {
      const actor = await loadFeedbackActor(supabase, user.id);
      const handle = typeof actor?.username === "string" ? actor.username.trim() : "";
      return {
        message,
        page_url,
        user_handle: handle || null,
        user_id: user.id,
        plan: feedbackPlan(actor),
        created_at: createdAt,
        feedback_id: feedbackId,
      };
    });

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
