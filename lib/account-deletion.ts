import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { vercelService } from "@/lib/vercel-service";

export function getAdminClient() {
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

async function collectAssetPaths(adminClient: SupabaseClient, prefix: string): Promise<string[]> {
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

async function deleteUserAssets(adminClient: SupabaseClient, userId: string) {
  const paths = await collectAssetPaths(adminClient, userId);

  if (!paths.length) {
    return;
  }

  const { error } = await adminClient.storage.from("assets").remove(paths);

  if (error) {
    console.error("Error borrando assets del usuario:", error);
  }
}

export async function deleteAccountByUserId(adminClient: SupabaseClient, userId: string) {
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("custom_domain")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Error obteniendo perfil antes de borrar:", profileError);
  }

  if (profile?.custom_domain) {
    await vercelService.removeDomain(profile.custom_domain);
  }

  await deleteUserAssets(adminClient, userId);

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

  if (deleteError) {
    console.error("Error eliminando usuario:", deleteError);
    throw new Error("No se pudo eliminar la cuenta");
  }
}
