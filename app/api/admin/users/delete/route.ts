import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-auth";
import { ADMIN_USERNAME } from "@/lib/constants";
import { deleteAccountByUserId, getAdminClient as getAccountDeletionClient } from "@/lib/account-deletion";

export const dynamic = "force-dynamic";

function normalizeUsername(value: string | null) {
  return value?.trim().replace(/^@+/, "").toLowerCase() || "";
}

export async function GET(request: NextRequest) {
  const adminAuth = await getAdminClient(request);
  if (!adminAuth) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = normalizeUsername(searchParams.get("username"));

  if (!username) {
    return NextResponse.json({ error: "Falta username." }, { status: 400 });
  }

  const adminClient = getAccountDeletionClient();
  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("id, username, name, image, custom_domain")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error("Error buscando usuario para borrar:", error);
    return NextResponse.json({ error: "No se pudo buscar la cuenta." }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: "No encontramos una cuenta con ese username." }, { status: 404 });
  }

  const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(profile.id);

  if (authError) {
    console.error("Error obteniendo auth user para borrado admin:", authError);
  }

  return NextResponse.json({
    user: {
      id: profile.id,
      username: profile.username,
      name: profile.name,
      image: profile.image,
      customDomain: profile.custom_domain,
      email: authUser.user?.email ?? null,
      createdAt: authUser.user?.created_at ?? null,
    },
  });
}

export async function DELETE(request: NextRequest) {
  const adminAuth = await getAdminClient(request);
  if (!adminAuth) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const username = normalizeUsername(body?.username ?? null);
    const confirmation = body?.confirmation?.trim();

    if (!username) {
      return NextResponse.json({ error: "Falta username." }, { status: 400 });
    }

    if (username === ADMIN_USERNAME) {
      return NextResponse.json({ error: "No podés borrar la cuenta admin desde este panel." }, { status: 400 });
    }

    const expectedConfirmation = `Eliminar @${username}`;
    if (confirmation !== expectedConfirmation) {
      return NextResponse.json(
        { error: `Escribí exactamente "${expectedConfirmation}" para confirmar.` },
        { status: 400 }
      );
    }

    const adminClient = getAccountDeletionClient();
    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("id, username, name")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      console.error("Error obteniendo cuenta a borrar:", error);
      return NextResponse.json({ error: "No se pudo cargar la cuenta." }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: "No encontramos una cuenta con ese username." }, { status: 404 });
    }

    await deleteAccountByUserId(adminClient, profile.id);

    return NextResponse.json({
      success: true,
      deletedUser: {
        id: profile.id,
        username: profile.username,
        name: profile.name,
      },
    });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: "No se pudo eliminar la cuenta." }, { status: 500 });
  }
}
