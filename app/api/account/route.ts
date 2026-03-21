import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteAccountByUserId, getAdminClient } from "@/lib/account-deletion";

export const dynamic = "force-dynamic";

const CONFIRMATION_TEXT = "Quiero eliminar mi cuenta";

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const confirmation = body?.confirmation;

    if (confirmation !== CONFIRMATION_TEXT) {
      return NextResponse.json(
        { error: `Escribí exactamente "${CONFIRMATION_TEXT}" para confirmar.` },
        { status: 400 }
      );
    }

    const adminClient = getAdminClient();
    await deleteAccountByUserId(adminClient, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "No se pudo eliminar la cuenta" }, { status: 500 });
  }
}
