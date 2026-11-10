// Guardrails del MCP. No pega a la red, no manda mail, no lee secretos.
// Uso: npx tsx scripts/verify-mcp.ts
import fs from "fs";
import path from "path";
import { updateCandidate, type ActivityRow, type PublicBlock, type PublicProfile } from "../lib/avances-builders";
import { profilePatchSchema } from "../lib/profile-schemas";
import { effectiveBlockLimit, launchPlanIsPro, mcpBatchAllowed, mcpCallAllowed, MCP_FREE_CALLS_PER_HOUR, MCP_PRO_CALLS_PER_HOUR } from "../lib/mcp/limits";
import { auditMeta, dispatchMcp } from "../lib/mcp/server";
import { handleMcpHttp, readRpcView } from "../lib/mcp/http";
import { endpointsForIssuer, wwwAuthenticate } from "../lib/mcp/oauth/metadata";
import { countUsableMcpTokens, isMcpTokenExpired, mcpTokenExpiresAt, parseMcpTokenTtl } from "../lib/mcp/token-expiry";
import { createProjectInputSchema, updateProfileInputSchema } from "../lib/mcp/schemas";
import { announceLaunch, createProject, deleteProject, getMyProfile, listMyProjects, postUpdate, syncFromGithub, updateProfile, updateProject, MCP_TOOL_NAMES } from "../lib/mcp/tools";
import { aiCatalog, MCP_CARD_DESCRIPTION, MCP_CARD_NAME, MCP_CARD_VERSION, mcpServerCard } from "../lib/mcp/discovery";
import { PUBLISH_PROMPT, STARTER_PROMPT } from "../lib/mcp/guide";
import { claudeConfig, cursorConfig, tokenConfig, vscodeConfig } from "../lib/mcp/install-links";
import { generateMcpToken, hashMcpToken, parseBearer } from "../lib/mcp/tokens";
import type { CreateLaunchResult } from "../lib/launch-service";
import type { McpBlock, McpProfile, McpStore } from "../lib/mcp/types";

let failed = 0;
function ok(name: string, condition: boolean, detail?: string) {
  if (!condition) failed++;
  console.log(`${condition ? "✓" : "✗"} ${name}${!condition && detail ? `\n    ${detail}` : ""}`);
}

const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

function profile(partial: Partial<McpProfile> = {}): McpProfile {
  return {
    id: USER,
    username: "ada",
    name: "Ada",
    tagline: "buildeo",
    image: null,
    github_handle: "ada",
    accent_color: "#C8FF00",
    border_radius: "1.5rem",
    layout: "dev_heavy",
    roles: ["developer"],
    location: "Buenos Aires",
    country: "AR",
    available: true,
    subscription_tier: "free",
    pro_since: null,
    referral_reward_expires_at: null,
    free_trial_claimed_at: null,
    free_trial_started_at: null,
    free_trial_ends_at: null,
    free_trial_last_insights_viewed_at: null,
    extra_blocks_from_share: 0,
    builder_score: 10,
    published_board: 0,
    ...partial,
  };
}

function block(partial: Partial<McpBlock> & Pick<McpBlock, "id" | "type">): McpBlock {
  return {
    user_id: USER,
    data: {},
    visible: true,
    sub_site_id: null,
    board_index: 0,
    order: 0,
    col_span: 1,
    row_span: 1,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    ...partial,
  };
}

function memory(initial?: { profile?: McpProfile; blocks?: McpBlock[]; launches?: number }): McpStore & { activities: ActivityRow[]; deleted: string[] } {
  const state = {
    profile: initial?.profile || profile(),
    blocks: initial?.blocks ? [...initial.blocks] : [],
    launches: initial?.launches || 0,
    activities: [] as ActivityRow[],
    deleted: [] as string[],
  };
  const store: McpStore & { activities: ActivityRow[]; deleted: string[] } = {
    activities: state.activities,
    deleted: state.deleted,
    async getProfile(userId) {
      return state.profile.id === userId ? state.profile : null;
    },
    async updateProfile(userId, patch) {
      if (state.profile.id !== userId) return;
      state.profile = { ...state.profile, ...patch } as McpProfile;
    },
    async listMainBlocks(userId) {
      return state.blocks.filter((item) => item.user_id === userId && item.sub_site_id == null);
    },
    async countVisibleMainBlocks(userId, boardIndex) {
      return state.blocks.filter((item) => item.user_id === userId && item.sub_site_id == null && item.visible && item.board_index === boardIndex).length;
    },
    async insertBlock(userId, input) {
      const created: McpBlock = {
        id: `block-${state.blocks.length + 1}`,
        user_id: userId,
        type: input.type,
        data: input.data,
        visible: true,
        sub_site_id: null,
        board_index: input.boardIndex,
        order: state.blocks.length,
        col_span: input.colSpan,
        row_span: input.rowSpan,
        created_at: new Date().toISOString(),
      };
      state.blocks.push(created);
      return created;
    },
    async updateBlockData(userId, blockId, data) {
      const found = state.blocks.find((item) => item.id === blockId && item.user_id === userId && item.sub_site_id == null);
      if (!found) return null;
      found.data = data;
      return found;
    },
    async deleteProject(userId, blockId) {
      const index = state.blocks.findIndex((item) => item.id === blockId && item.user_id === userId && item.type === "project" && item.sub_site_id == null);
      if (index < 0) return false;
      state.deleted.push(blockId);
      state.blocks.splice(index, 1);
      return true;
    },
    async insertActivity(userId, type, data) {
      const row: ActivityRow = {
        id: `act-${state.activities.length + 1}`,
        user_id: userId,
        created_at: new Date().toISOString(),
        data,
      };
      state.activities.push(row);
      return { id: row.id, created_at: row.created_at };
    },
    async createLaunch(blockId, userId, _week, isPro): Promise<CreateLaunchResult> {
      const found = state.blocks.find((item) => item.id === blockId && item.user_id === userId && item.type === "project");
      if (!found) return { ok: false, error: "not_owner" };
      const link = typeof found.data.link === "string" ? found.data.link : "";
      if (!/^https?:\/\//i.test(link)) return { ok: false, error: "no_link" };
      if (!isPro && state.launches >= 1) return { ok: false, error: "monthly_limit" };
      state.launches += 1;
      return { ok: true, launchId: `launch-${state.launches}` };
    },
    async syncGithub() {
      return { updated: [{ id: "gh-1" }] };
    },
    async recomputeScore() {},
  };
  return store;
}

const minted = generateMcpToken();
ok("el token arranca con hvst_", minted.raw.startsWith("hvst_"));
ok("el hash no es el token", minted.hash !== minted.raw && !minted.hash.includes(minted.raw.slice(5)));
ok("el prefijo no alcanza para reconstruir el token", minted.prefix.length === 12 && minted.raw.startsWith(minted.prefix) && minted.prefix !== minted.raw);
ok("el hash es estable", hashMcpToken(minted.raw) === minted.hash);
ok("Bearer válido", parseBearer(`Bearer ${minted.raw}`) === minted.raw);
ok("sin Bearer no pasa", parseBearer(minted.raw) === null);
ok("un token corto no pasa", parseBearer("Bearer hvst_corto") === null);

const expiryNow = Date.parse("2026-11-10T12:00:00.000Z");
const dayMs = 24 * 60 * 60 * 1000;
ok("sin fecha no vence", isMcpTokenExpired(null, expiryNow) === false && isMcpTokenExpired(undefined, expiryNow) === false && isMcpTokenExpired("", expiryNow) === false);
ok("una fecha futura no está vencida", isMcpTokenExpired(new Date(expiryNow + 1000).toISOString(), expiryNow) === false);
ok("una fecha pasada está vencida", isMcpTokenExpired(new Date(expiryNow - 1000).toISOString(), expiryNow) === true);
ok("el instante exacto está vencido", isMcpTokenExpired(new Date(expiryNow).toISOString(), expiryNow) === true);
ok("una fecha rota se rechaza", isMcpTokenExpired("no-es-fecha", expiryNow) === true);
ok("30 días suma 30 días", mcpTokenExpiresAt("30d", expiryNow) === new Date(expiryNow + 30 * dayMs).toISOString());
ok("90 días suma 90 días", mcpTokenExpiresAt("90d", expiryNow) === new Date(expiryNow + 90 * dayMs).toISOString());
ok("nunca no tiene vencimiento", mcpTokenExpiresAt("never", expiryNow) === null);
ok("si no elegís, son 90 días", parseMcpTokenTtl(undefined) === "90d" && parseMcpTokenTtl(null) === "90d");
ok("30 días, 90 días y nunca son los únicos plazos", parseMcpTokenTtl("30d") === "30d" && parseMcpTokenTtl("90d") === "90d" && parseMcpTokenTtl("never") === "never" && parseMcpTokenTtl("1d") === "invalid" && parseMcpTokenTtl(30) === "invalid");
ok("los vencidos no cuentan para el tope", countUsableMcpTokens([
  { revoked_at: null, expires_at: null },
  { revoked_at: null, expires_at: new Date(expiryNow - 1).toISOString() },
  { revoked_at: "2020-01-01T00:00:00.000Z", expires_at: null },
], expiryNow) === 1);

ok("accent inválido lo rechaza el mismo schema del dashboard", profilePatchSchema.safeParse({ accent_color: "red" }).success === false);
ok("el MCP usa ese límite de tagline", updateProfileInputSchema.safeParse({ tagline: "a".repeat(201) }).success === false);
ok("border_radius no acepta CSS inyectado", updateProfileInputSchema.safeParse({ border_radius: "1.5rem;color:red" }).success === false);
ok("un link que no es http se rechaza", updateProfileInputSchema.safeParse({ links: [{ platform: "website", url: "javascript:alert(1)" }] }).success === false);
ok("una imagen javascript se rechaza", updateProfileInputSchema.safeParse({ image: "javascript:alert(1)" }).success === false);
ok("un data URI de imagen se rechaza", updateProfileInputSchema.safeParse({ image: "data:image/png;base64,aaaa" }).success === false);
ok("una imagen https pasa", updateProfileInputSchema.safeParse({ image: "https://ada.dev/me.png" }).success === true);
ok("imageUrl del proyecto no acepta javascript", createProjectInputSchema.safeParse({ title: "X", imageUrl: "javascript:alert(1)" }).success === false);

ok("free son 60 llamadas", MCP_FREE_CALLS_PER_HOUR === 60 && mcpCallAllowed(59, 60) && !mcpCallAllowed(60, 60));
ok("pro son 600", MCP_PRO_CALLS_PER_HOUR === 600 && mcpBatchAllowed(599, 1, 600) && !mcpBatchAllowed(599, 2, 600));
ok("el cupo de bloques free es 5 y pro 22", effectiveBlockLimit(profile()) === 5 && effectiveBlockLimit(profile({ subscription_tier: "pro" })) === 22);
ok("el extra por compartir suma", effectiveBlockLimit(profile({ extra_blocks_from_share: 1 })) === 6);
ok("el lanzamiento Pro no incluye la prueba", launchPlanIsPro(profile({ free_trial_ends_at: new Date(Date.now() + 86400000).toISOString() })) === false);
ok("el lanzamiento Pro sí incluye subscription_tier", launchPlanIsPro(profile({ subscription_tier: "pro" })) === true);

const rpc = readRpcView(JSON.stringify({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "get_my_profile", arguments: {} } }));
ok("una tools/call cuenta para el cupo", rpc.calls.length === 1 && rpc.id === 7);
ok("initialize no cuenta como tool", readRpcView(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} })).calls.length === 0);

const meta = auditMeta({ project_id: "p1", note: "secreto de la bio", bio: "tampoco" });
ok("el audit no guarda la nota", !JSON.stringify(meta).includes("secreto") && !JSON.stringify(meta).includes("tampoco") && meta.project_id === "p1");

async function run() {
  const base = memory({
    blocks: [
      block({ id: "10000000-0000-4000-8000-000000000001", type: "hero", data: { name: "Ada", tagline: "buildeo", description: "bio vieja", location: "Córdoba" } }),
      block({ id: "10000000-0000-4000-8000-000000000002", type: "project", data: { title: "Huevo", description: "la app", link: "https://huevo.dev" } }),
      block({ id: "10000000-0000-4000-8000-000000000099", type: "project", user_id: OTHER, data: { title: "Ajeno" } }),
      block({ id: "10000000-0000-4000-8000-000000000098", type: "project", sub_site_id: "sub-1", data: { title: "Sub" } }),
    ],
  });

  const mine = await getMyProfile(base, USER);
  ok("get_my_profile devuelve la bio del hero", mine.ok && mine.data.bio === "bio vieja");
  const foreign = await getMyProfile(base, OTHER);
  ok("otro user id no ve este perfil", !foreign.ok && foreign.error === "not_found");

  const renamed = await updateProfile(base, USER, { username: "hackeado", email: "a@b.c" });
  ok("username y email no entran por el MCP", !renamed.ok);
  ok("el username del perfil no cambió", base && (await base.getProfile(USER))?.username === "ada");

  const updated = await updateProfile(base, USER, {
    tagline: "headline nueva",
    bio: "estoy buildeando el MCP",
    location: "Rosario",
    links: [{ platform: "website", url: "https://ada.dev" }],
    stack: ["TypeScript"],
  });
  ok("update_profile guarda headline y bio", updated.ok && updated.data.tagline === "headline nueva" && updated.data.bio === "estoy buildeando el MCP");
  ok("update_profile crea links y stack", updated.ok && Array.isArray(updated.data.links) && Array.isArray(updated.data.stack));

  const listed = await listMyProjects(base, USER);
  ok("list_my_projects no incluye el de otro ni el sub-site", listed.ok && (listed.data.projects as { id: string }[]).length === 1 && (listed.data.projects as { id: string }[])[0].id === "10000000-0000-4000-8000-000000000002");

  const full = memory({
    blocks: [0, 1, 2, 3, 4].map((index) => block({ id: `full-${index}`, type: "project", data: { title: `P${index}` } })),
  });
  const capped = await createProject(full, USER, { title: "No entra" });
  ok("free no pasa de 5 bloques", !capped.ok && capped.error === "limit");

  const pro = memory({ profile: profile({ subscription_tier: "pro" }), blocks: [0, 1, 2, 3, 4].map((index) => block({ id: `pro-${index}`, type: "metric", data: {} })) });
  const created = await createProject(pro, USER, { title: "Sexto", link: "https://sexto.dev", description: "sale" });
  ok("pro puede crear el sexto", created.ok === true);

  const fresh = memory({
    blocks: [block({ id: "10000000-0000-4000-8000-000000000003", type: "project", created_at: new Date().toISOString(), data: { title: "Recién", description: "" } })],
  });
  const echo = await postUpdate(fresh, USER, { project_id: "10000000-0000-4000-8000-000000000003", note: "recién lo creé" });
  ok("un avance inmediato no cuenta para el cron", echo.ok && echo.data.counts_for_avances === false && echo.data.avances_reason === "create_echo");

  const aged = memory({
    blocks: [block({ id: "10000000-0000-4000-8000-000000000004", type: "project", data: { title: "Viejo", description: "antes", link: "https://viejo.dev" } })],
  });
  const avance = await postUpdate(aged, USER, { project_id: "10000000-0000-4000-8000-000000000004", note: "cerré el onboarding" });
  ok("post_update deja la nota", avance.ok && avance.data.note === "cerré el onboarding");
  const activity = aged.activities[aged.activities.length - 1];
  const saved = (await aged.listMainBlocks(USER)).find((item) => item.id === "10000000-0000-4000-8000-000000000004");
  const candidate = saved
    ? updateCandidate(activity, {
        id: saved.id,
        user_id: saved.user_id,
        type: saved.type,
        data: saved.data,
        visible: saved.visible,
        sub_site_id: saved.sub_site_id,
        created_at: saved.created_at,
      } satisfies PublicBlock, { id: USER, username: "ada", name: "Ada" } satisfies PublicProfile)
    : null;
  ok("ese avance lo ve el cron de avances", candidate?.sourceType === "update" && candidate.sourceId === "10000000-0000-4000-8000-000000000004");

  const patched = await updateProject(aged, USER, { project_id: "10000000-0000-4000-8000-000000000004", title: "Viejo v2" });
  ok("update_project cambia el título", patched.ok && (patched.data.project as { title: string }).title === "Viejo v2");
  const stolen = await updateProject(aged, USER, { project_id: "33333333-3333-4333-8333-333333333333", title: "no" });
  ok("un id que no es tuyo es not_found", !stolen.ok && stolen.error === "not_found");

  const gone = await deleteProject(aged, USER, { project_id: "10000000-0000-4000-8000-000000000004", confirm: false });
  ok("borrar sin confirm no borra", !gone.ok && gone.error === "confirm_required" && aged.deleted.length === 0);
  const removed = await deleteProject(aged, USER, { project_id: "10000000-0000-4000-8000-000000000004", confirm: true });
  ok("borrar con confirm sí borra", removed.ok && aged.deleted.includes("10000000-0000-4000-8000-000000000004"));

  const launchStore = memory({
    blocks: [block({ id: "10000000-0000-4000-8000-000000000005", type: "project", data: { title: "Ship", link: "https://ship.dev" } })],
    launches: 1,
  });
  const limited = await announceLaunch(launchStore, USER, { project_id: "10000000-0000-4000-8000-000000000005" });
  ok("free no lanza dos veces en el mes", !limited.ok && limited.error === "monthly_limit");
  const future = await announceLaunch(memory({
    blocks: [block({ id: "10000000-0000-4000-8000-000000000005", type: "project", data: { title: "Ship", link: "https://ship.dev" } })],
  }), USER, { project_id: "10000000-0000-4000-8000-000000000005", week: "2099-W01" });
  ok("programar una semana futura pide Pro", !future.ok && future.error === "pro_required");

  const synced = await syncFromGithub(memory(), USER, { force: true });
  ok("sync_from_github devuelve los bloques tocados", synced.ok && (synced.data.updated as { id: string }[])[0]?.id === "gh-1");

  const serverStore = memory({
    blocks: [block({ id: "10000000-0000-4000-8000-000000000001", type: "hero", data: { description: "hola" } })],
  });
  const init = await dispatchMcp(new Request("https://huevsite.io/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "verify", version: "0" } },
    }),
  }), { userId: USER, store: serverStore, audit: async () => {} });
  const initBody = await init.json();
  ok("initialize responde por Streamable HTTP", init.status === 200 && initBody?.result?.serverInfo?.name === "huevsite");

  const listedTools = await dispatchMcp(new Request("https://huevsite.io/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
  }), { userId: USER, store: serverStore, audit: async () => {} });
  const toolsBody = await listedTools.json();
  const names = (toolsBody?.result?.tools || []).map((tool: { name: string }) => tool.name).sort();
  ok("el servidor publica las 9 tools", JSON.stringify(names) === JSON.stringify([...MCP_TOOL_NAMES].sort()), JSON.stringify(names));

  let audited = "";
  const called = await dispatchMcp(new Request("https://huevsite.io/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_my_profile", arguments: {} } }),
  }), {
    userId: USER,
    store: serverStore,
    audit: async (tool) => {
      audited = tool;
    },
  });
  const callBody = await called.json();
  const text = callBody?.result?.content?.[0]?.text || "";
  ok("tools/call get_my_profile audita y responde", audited === "get_my_profile" && text.includes("ada"), text.slice(0, 180));

  const tokenRequest = (forwardedFor: string) => new Request("https://huevsite.io/api/mcp", {
    method: "POST",
    headers: {
      authorization: `Bearer ${minted.raw}`,
      "content-type": "application/json",
      accept: "application/json",
      "x-forwarded-for": forwardedFor,
    },
    body: "{}",
  });
  const expiredAuth = await handleMcpHttp(tokenRequest("203.0.113.50"), {
    lookupPersonalToken: async () => ({
      id: "tok-expired",
      user_id: USER,
      revoked_at: null,
      expires_at: "2000-01-01T00:00:00.000Z",
    }),
  });
  const invalidAuth = await handleMcpHttp(tokenRequest("203.0.113.51"), {
    lookupPersonalToken: async () => null,
  });
  const expiredBody = await expiredAuth.json();
  const invalidBody = await invalidAuth.json();
  const expiredChallenge = expiredAuth.headers.get("www-authenticate") || "";
  const invalidChallenge = invalidAuth.headers.get("www-authenticate") || "";
  const expectedChallenge = wwwAuthenticate(endpointsForIssuer("https://huevsite.io").metadataUrl);
  ok("un token vencido responde 401", expiredAuth.status === 401 && expiredBody?.error?.message === "Token inválido o vencido.");
  ok("el vencido tiene la misma forma que un token inválido", expiredAuth.status === invalidAuth.status && JSON.stringify(expiredBody) === JSON.stringify(invalidBody) && expiredChallenge === invalidChallenge);
  ok("ese 401 trae resource_metadata", expiredChallenge === expectedChallenge && expiredChallenge.includes("resource_metadata="), expiredChallenge);
  const card = mcpServerCard("https://huevsite.io");
  ok("la server card cabe en 100 caracteres", MCP_CARD_DESCRIPTION.length >= 1 && MCP_CARD_DESCRIPTION.length <= 100, String(MCP_CARD_DESCRIPTION.length));
  ok("la server card tiene nombre reverse-dns y version del runtime", card.name === MCP_CARD_NAME && /^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/.test(card.name) && card.version === MCP_CARD_VERSION && card.title === "huevsite");
  ok("la server card apunta al endpoint", card.remotes[0]?.type === "streamable-http" && card.remotes[0]?.url === "https://huevsite.io/api/mcp" && (card.remotes[0]?.supportedProtocolVersions?.length || 0) > 0);
  ok("la server card no lista tools", !("tools" in card) && card.websiteUrl === "https://huevsite.io/mcp");
  const catalog = aiCatalog("https://huevsite.io");
  ok("el catalogo apunta a la server card", catalog.entries[0]?.type === "application/mcp-server-card+json" && catalog.entries[0]?.url === "https://huevsite.io/api/mcp/server-card");
  ok("los prompts nativos tienen texto", STARTER_PROMPT.includes("get_my_profile") && PUBLISH_PROMPT.includes("post_update"));
  ok("las configs pegan la URL", [cursorConfig, vscodeConfig, claudeConfig, tokenConfig].every((build) => build("https://huevsite.io/api/mcp").includes("https://huevsite.io/api/mcp")));

  const docs = fs.readFileSync(path.join(__dirname, "../app/mcp/page.tsx"), "utf8");
  ok("la doc muestra los prompts en bloques copiables", ["CopyBlock", "armar_mi_perfil", "publicar_avance", "STARTER_PROMPT", "PUBLISH_PROMPT", "cursorConfig", "vscodeConfig", "claudeConfig"].every((bit) => docs.includes(bit)));
  const robots = fs.readFileSync(path.join(__dirname, "../public/robots.txt"), "utf8");
  ok("robots deja ver mcp, llms y well-known", ["Allow: /mcp", "Allow: /llms.txt", "Allow: /.well-known/", "Allow: /api/mcp/server-card"].every((bit) => robots.includes(bit)));
  const llms = fs.readFileSync(path.join(__dirname, "../public/llms.txt"), "utf8");
  const llmsFull = fs.readFileSync(path.join(__dirname, "../public/llms-full.txt"), "utf8");
  ok("llms.txt describe el endpoint, la auth y las tools", ["https://huevsite.io/api/mcp", "https://huevsite.io/mcp", "OAuth", "get_my_profile", "armar_mi_perfil"].every((bit) => llms.includes(bit) && llmsFull.includes(bit)));
  const sitemap = fs.readFileSync(path.join(__dirname, "../app/sitemap.ts"), "utf8");
  ok("el sitemap incluye /mcp", sitemap.includes("/mcp"));
  const home = fs.readFileSync(path.join(__dirname, "../app/page.tsx"), "utf8");
  ok("el home apunta a la guia del mcp", home.includes('rel="help"') && home.includes("/mcp"));

  const migration = fs.readFileSync(path.join(__dirname, "../supabase/migrations/20261110183000_mcp_access_tokens.sql"), "utf8");
  ok("la migración prende RLS", /enable row level security/i.test(migration));
  ok("la migración le saca el GRANT a anon y authenticated", /revoke all on public\.mcp_access_tokens from anon, authenticated/i.test(migration) && /revoke all on public\.mcp_audit_log from anon, authenticated/i.test(migration));
  ok("la migración no guarda el token en claro", !/token text/i.test(migration) && /token_hash/.test(migration));

  const expiryMigration = fs.readFileSync(path.join(__dirname, "../supabase/migrations/20261110210000_mcp_token_expires_at.sql"), "utf8");
  ok(
    "la migración de vencimiento deja expires_at nullable y no reescribe filas",
    /alter table public\.mcp_access_tokens\s+add column if not exists expires_at timestamptz\s*;/i.test(expiryMigration)
      && !/expires_at timestamptz not null/i.test(expiryMigration)
      && !/expires_at timestamptz default/i.test(expiryMigration)
      && !/update\s+public\.mcp_access_tokens/i.test(expiryMigration),
  );

  if (failed) {
    console.error(`\n${failed} checks fallaron`);
    process.exit(1);
  }
  console.log("\nmcp ok");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
