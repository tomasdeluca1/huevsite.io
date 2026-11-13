/**
 * Normaliza los links sociales ya guardados.
 *
 * Toca:
 * - public.blocks donde type = 'social' (data.links: platform, url, handle, label, favicon)
 * - public.blocks donde type = 'github' (data.username), si el usuario es una URL o tiene espacios
 * - public.profiles.github_handle, con el mismo criterio
 *
 * Arregla el caso real: el usuario pegó una URL en el handle y la app le antepuso
 * el prefijo (https://linkedin.com/in/https://www.linkedin.com/in/x/,
 * https://youtube.com/@https://www.youtube.com/X), más sitios sin esquema y
 * handles con espacios al final.
 *
 * Es idempotente: la segunda corrida no vuelve a escribir lo que ya quedó canónico.
 * Lo que no se puede convertir se reporta y no se toca.
 *
 * NO lo corras contra producción desde un agente. Corrélo vos, con el entorno
 * del proyecto que quieras arreglar.
 *
 *   npx tsx scripts/normalize-social-links.ts              # dry-run, no escribe
 *   npx tsx scripts/normalize-social-links.ts --dry-run
 *   npx tsx scripts/normalize-social-links.ts --apply      # escribe
 *
 * Necesita NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno
 * (por ejemplo .env.local). El script no imprime esos valores ni la URL de la base.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { canonicalGithubUsername, planSocialLinks, type SocialLinkProblem } from "../lib/social-url";

dotenv.config({ path: ".env.local" });

const PAGE = 200;

interface BlockRow {
  id: string;
  user_id: string;
  type: string;
  data: { links?: unknown; username?: unknown } | null;
}

interface ProfileRow {
  id: string;
  username: string | null;
  github_handle: string | null;
}

export interface NormalizeReport {
  mode: "dry-run" | "apply";
  socialBlocks: number;
  linksFixed: number;
  linksAlreadyOk: number;
  githubBlocksFixed: number;
  profileHandlesFixed: number;
  unfixable: Array<SocialLinkProblem & { username: string; blockId: string }>;
}

function clip(value: string): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > 180 ? `${clean.slice(0, 177)}...` : clean;
}

function publicError(error: unknown): string {
  const message = error instanceof Error ? error.message : "falló la normalización";
  return message.replace(/https?:\/\/\S+/gi, "[url]").replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[secret]");
}

async function eachPage<T extends { id: string }>(
  supabase: SupabaseClient,
  table: "blocks" | "profiles",
  columns: string,
  filter: (query: any) => any,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  for (;;) {
    const query = filter(supabase.from(table).select(columns).order("id", { ascending: true }).range(from, from + PAGE - 1));
    const { data, error } = await query;
    if (error) throw new Error(publicError(error));
    const page = (data || []) as T[];
    rows.push(...page);
    if (page.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

export async function normalizeStoredSocialLinks(supabase: SupabaseClient, apply: boolean): Promise<NormalizeReport> {
  const blocks = await eachPage<BlockRow>(supabase, "blocks", "id, user_id, type, data", (query) =>
    query.in("type", ["social", "github"]),
  );
  const profiles = await eachPage<ProfileRow>(supabase, "profiles", "id, username, github_handle", (query) => query);
  const names = new Map(profiles.map((profile) => [profile.id, profile.username || profile.id]));

  const report: NormalizeReport = {
    mode: apply ? "apply" : "dry-run",
    socialBlocks: 0,
    linksFixed: 0,
    linksAlreadyOk: 0,
    githubBlocksFixed: 0,
    profileHandlesFixed: 0,
    unfixable: [],
  };

  for (const block of blocks) {
    const username = names.get(block.user_id) || block.user_id;
    if (block.type === "social") {
      report.socialBlocks += 1;
      const plan = planSocialLinks(block.data?.links);
      const kept = Array.isArray(block.data?.links) ? block.data.links.length - plan.unfixable.length : 0;
      report.linksAlreadyOk += Math.max(0, kept - plan.fixed.length);
      report.linksFixed += plan.fixed.length;
      for (const problem of plan.unfixable) {
        report.unfixable.push({ ...problem, username, blockId: block.id, before: clip(problem.before) });
      }
      if (apply && plan.changed) {
        const { error } = await supabase
          .from("blocks")
          .update({ data: { ...(block.data || {}), links: plan.links } })
          .eq("id", block.id);
        if (error) throw new Error(publicError(error));
      }
      continue;
    }

    const raw = typeof block.data?.username === "string" ? block.data.username : "";
    if (!raw.trim()) continue;
    const usernameValue = canonicalGithubUsername(raw);
    if (!usernameValue) {
      report.unfixable.push({
        platform: "github",
        before: clip(raw),
        reason: "Ese usuario de GitHub no es válido.",
        username,
        blockId: block.id,
      });
      continue;
    }
    if (usernameValue === raw) continue;
    report.githubBlocksFixed += 1;
    if (apply) {
      const { error } = await supabase
        .from("blocks")
        .update({ data: { ...(block.data || {}), username: usernameValue } })
        .eq("id", block.id);
      if (error) throw new Error(publicError(error));
    }
  }

  for (const profile of profiles) {
    const raw = profile.github_handle || "";
    if (!raw.trim()) continue;
    const usernameValue = canonicalGithubUsername(raw);
    if (!usernameValue) {
      report.unfixable.push({
        platform: "github_handle",
        before: clip(raw),
        reason: "Ese usuario de GitHub no es válido.",
        username: profile.username || profile.id,
        blockId: "",
      });
      continue;
    }
    if (usernameValue === raw) continue;
    report.profileHandlesFixed += 1;
    if (apply) {
      const { error } = await supabase.from("profiles").update({ github_handle: usernameValue }).eq("id", profile.id);
      if (error) throw new Error(publicError(error));
    }
  }

  return report;
}

function printReport(report: NormalizeReport) {
  console.log(`modo: ${report.mode}`);
  console.log(`bloques de redes leídos: ${report.socialBlocks}`);
  console.log(`links corregidos: ${report.linksFixed}`);
  console.log(`links que ya estaban bien: ${report.linksAlreadyOk}`);
  console.log(`bloques de GitHub corregidos: ${report.githubBlocksFixed}`);
  console.log(`github_handle corregidos: ${report.profileHandlesFixed}`);
  console.log(`sin arreglo: ${report.unfixable.length}`);
  if (report.unfixable.length) {
    console.log("\nPerfiles con un link que no se pudo arreglar:");
    for (const item of report.unfixable) {
      const where = item.blockId ? ` bloque ${item.blockId}` : "";
      console.log(`- ${item.username}${where} [${item.platform}] ${item.reason}`);
      console.log(`  valor: ${item.before}`);
    }
  }
  if (report.mode === "dry-run") {
    console.log("\nDry-run: no se escribió nada. Para guardar los que se pueden arreglar: npx tsx scripts/normalize-social-links.ts --apply");
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  if (process.argv.includes("--apply") && process.argv.includes("--dry-run")) {
    console.error("Elegí uno: --dry-run o --apply.");
    process.exit(1);
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno. No se imprimen los valores.");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const report = await normalizeStoredSocialLinks(supabase, apply);
  printReport(report);
}

const entry = process.argv[1] || "";
if (entry.endsWith("normalize-social-links.ts") || entry.endsWith("normalize-social-links.js")) {
  main().catch((error: unknown) => {
    console.error(publicError(error));
    process.exit(1);
  });
}
