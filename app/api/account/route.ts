import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { vercelService } from "@/lib/vercel-service";

export const dynamic = "force-dynamic";

const CONFIRMATION_TEXT = "Quiero eliminar mi cuenta";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin no está configurado");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function collectAssetPaths(adminClient: ReturnType<typeof getAdminClient>, prefix: string): Promise<string[]> {
  const { data, error } = await adminClient.storage.from("assets").list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    console.error("Error listando assets para borrado:", error);
    return [];
  }

  const paths: string[] = [];

  for (const entry of data || []) {
    const fullPath = `${prefix}/${entry.name}`;
    const isFolder = !entry.id || entry.metadata === null;

    if (isFolder) {
      paths.push(...await collectAssetPaths(adminClient, fullPath));
      continue;
    }

    paths.push(fullPath);
  }

  return paths;
}

async function deleteUserAssets(adminClient: ReturnType<typeof getAdminClient>, userId: string) {
  const paths = await collectAssetPaths(adminClient, userId);

  if (!paths.length) {
    return;
  }

  const { error } = await adminClient.storage.from("assets").remove(paths);

  if (error) {
    console.error("Error borrando assets del usuario:", error);
  }
}

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

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("custom_domain")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Error obteniendo perfil antes de borrar:", profileError);
    }

    if (profile?.custom_domain) {
      await vercelService.removeDomain(profile.custom_domain);
    }

    await deleteUserAssets(adminClient, user.id);

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Error eliminando usuario:", deleteError);
      return NextResponse.json({ error: "No se pudo eliminar la cuenta" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "No se pudo eliminar la cuenta" }, { status: 500 });
  }
}
