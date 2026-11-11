import { isValidCountry } from "@/lib/countries";
import { isCreateEcho, isPublicProjectBlock } from "@/lib/avances-builders";
import { compareWeeks, currentLaunchWeek } from "@/lib/launch-week";
import { runDryRun } from "@/lib/mcp/dry-run";
import { applyPatch, boardBlocks, layoutView, planTidy, type LayoutPatch } from "@/lib/mcp/layout";
import { effectiveBlockLimit, launchPlanIsPro } from "@/lib/mcp/limits";
import { hasProAccess } from "@/lib/pro-access";
import {
  PROJECT_DATA_KEYS,
  announceLaunchInputSchema,
  arrangeBlocksInputSchema,
  createProjectInputSchema,
  deleteProjectInputSchema,
  emptyInputSchema,
  postUpdateInputSchema,
  syncGithubInputSchema,
  updateProfileInputSchema,
  updateProjectInputSchema,
} from "@/lib/mcp/schemas";
import { toolError, type McpBlock, type McpProfile, type McpStore, type ToolOutcome } from "@/lib/mcp/types";
import type { ZodTypeAny } from "zod";

const PROFILE_COLUMNS = [
  "name",
  "tagline",
  "accent_color",
  "layout",
  "roles",
  "location",
  "available",
  "github_handle",
  "image",
  "border_radius",
  "profile_layout",
  "link_box_style",
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}

function mainBlocks(blocks: McpBlock[]): McpBlock[] {
  return blocks.filter((block) => block.sub_site_id == null);
}

// Prefiere el bloque visible del tipo: si hay uno oculto antes en la grilla
// (un hero duplicado que se ocultó), las ediciones tienen que ir al que se ve.
function findTyped(blocks: McpBlock[], type: string): McpBlock | undefined {
  const ofType = mainBlocks(blocks).filter((block) => block.type === type);
  return ofType.find((block) => block.visible) || ofType[0];
}

function projectView(block: McpBlock) {
  const data = asRecord(block.data);
  return {
    id: block.id,
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    link: typeof data.link === "string" ? data.link : "",
    stack: Array.isArray(data.stack) ? data.stack : [],
    status: typeof data.status === "string" ? data.status : "idea",
    metrics: typeof data.metrics === "string" ? data.metrics : "",
    launchDate: typeof data.launchDate === "string" ? data.launchDate : "",
    archived: data.archived === true,
    boxStyle: typeof data.boxStyle === "string" ? data.boxStyle : null,
    visible: block.visible,
    created_at: block.created_at,
  };
}

function avancesFlag(block: McpBlock, activityAt: string) {
  const publicBlock = {
    visible: block.visible,
    sub_site_id: block.sub_site_id,
    type: block.type,
    data: block.data as { archived?: unknown },
  };
  if (!isPublicProjectBlock(publicBlock)) {
    return { counts_for_avances: false, avances_reason: "not_public" as const };
  }
  if (isCreateEcho(block.created_at, activityAt)) {
    return { counts_for_avances: false, avances_reason: "create_echo" as const };
  }
  return { counts_for_avances: true, avances_reason: null };
}

async function loadProfile(store: McpStore, userId: string): Promise<McpProfile | ToolOutcome> {
  const profile = await store.getProfile(userId);
  if (!profile) return toolError("not_found", "No encontramos tu perfil.");
  return profile;
}

function boardIndexOf(profile: McpProfile): number {
  const value = profile.published_board ?? 0;
  return value >= 0 && value <= 2 ? value : 0;
}

async function ensureBlockRoom(store: McpStore, profile: McpProfile, boardIndex: number): Promise<ToolOutcome | null> {
  const limit = effectiveBlockLimit(profile);
  const count = await store.countVisibleMainBlocks(profile.id, boardIndex);
  if (count >= limit) {
    return toolError("limit", `Límite de bloques alcanzado (${limit}).`);
  }
  return null;
}

export async function getMyProfile(store: McpStore, userId: string): Promise<ToolOutcome> {
  const profile = await loadProfile(store, userId);
  if ("ok" in profile) return profile;
  const blocks = mainBlocks(await store.listMainBlocks(userId));
  const hero = findTyped(blocks, "hero");
  const social = findTyped(blocks, "social");
  const stack = findTyped(blocks, "stack");
  const heroData = asRecord(hero?.data);
  const socialData = asRecord(social?.data);
  const stackData = asRecord(stack?.data);
  const limit = effectiveBlockLimit(profile);
  const visible = blocks.filter((block) => block.visible && (block.board_index ?? 0) === boardIndexOf(profile)).length;

  return {
    ok: true,
    data: {
      username: profile.username,
      name: profile.name,
      tagline: profile.tagline,
      bio: typeof heroData.description === "string" ? heroData.description : "",
      location: profile.location,
      country: profile.country,
      roles: profile.roles || [],
      available: profile.available === true,
      github_handle: profile.github_handle,
      accent_color: profile.accent_color,
      layout: profile.layout,
      profile_layout: profile.profile_layout === "links" ? "links" : "portfolio",
      link_box_style: profile.link_box_style || "pill",
      border_radius: profile.border_radius,
      image: profile.image,
      image_focus: heroData.avatarFocus ?? null,
      builder_score: profile.builder_score || 0,
      plan: launchPlanIsPro(profile) ? "pro" : "free",
      has_pro_access: hasProAccess(profile),
      links: Array.isArray(socialData.links) ? socialData.links : [],
      stack: Array.isArray(stackData.items) ? stackData.items : [],
      projects: blocks.filter((block) => block.type === "project").map(projectView),
      limits: {
        visible_blocks: visible,
        block_limit: limit,
        published_board: boardIndexOf(profile),
      },
      grid: layoutView(boardBlocks(blocks, boardIndexOf(profile))),
    },
  };
}

export async function updateProfile(store: McpStore, userId: string, raw: unknown): Promise<ToolOutcome> {
  const parsed = updateProfileInputSchema.safeParse(raw);
  if (!parsed.success) {
    return toolError("invalid", parsed.error.issues.map((issue) => issue.message).join(" "));
  }
  const input = parsed.data;
  const hasChange = Object.entries(input).some(([, value]) => value !== undefined);
  if (!hasChange) return toolError("invalid", "Nada para actualizar.");
  const profile = await loadProfile(store, userId);
  if ("ok" in profile) return profile;

  if (input.country !== undefined && input.country !== "") {
    const code = input.country.toUpperCase();
    if (!isValidCountry(code)) return toolError("invalid", "country tiene que ser un código ISO de 2 letras.");
    input.country = code;
  }

  const columnPatch: Record<string, unknown> = {};
  for (const key of PROFILE_COLUMNS) {
    if (input[key] !== undefined) columnPatch[key] = input[key];
  }
  if (columnPatch.github_handle === "") columnPatch.github_handle = null;
  if (columnPatch.image === "") columnPatch.image = null;
  if (input.country !== undefined) columnPatch.country = input.country === "" ? null : input.country;

  const blocks = mainBlocks(await store.listMainBlocks(userId));
  const boardIndex = boardIndexOf(profile);
  const heroPatch: Record<string, unknown> = {};
  if (input.name !== undefined && input.name.trim()) heroPatch.name = input.name.trim();
  if (input.tagline !== undefined && input.tagline.trim()) heroPatch.tagline = input.tagline.trim();
  if (input.location !== undefined) heroPatch.location = input.location;
  if (input.image !== undefined) heroPatch.avatarUrl = input.image || "";
  if (input.bio !== undefined) heroPatch.description = input.bio;
  if (input.roles !== undefined) heroPatch.roles = input.roles;
  if (input.image_focus !== undefined) heroPatch.avatarFocus = input.image_focus;
  const needsHero = !findTyped(blocks, "hero") && Object.keys(heroPatch).length > 0;
  const needsSocial = !!input.links && !findTyped(blocks, "social");
  const needsStack = !!input.stack && !findTyped(blocks, "stack");
  const slots = Number(needsHero) + Number(needsSocial) + Number(needsStack);
  if (slots > 0) {
    const limit = effectiveBlockLimit(profile);
    const count = await store.countVisibleMainBlocks(profile.id, boardIndex);
    if (count + slots > limit) {
      return toolError("limit", `Límite de bloques alcanzado (${limit}).`);
    }
  }

  if (Object.keys(columnPatch).length > 0) {
    await store.updateProfile(userId, columnPatch);
  }

  const hero = findTyped(blocks, "hero");
  if (hero && Object.keys(heroPatch).length > 0) {
    await store.updateBlockData(userId, hero.id, { ...asRecord(hero.data), ...heroPatch });
  } else if (needsHero) {
    await store.insertBlock(userId, {
      type: "hero",
      data: heroPatch,
      boardIndex,
      colSpan: 2,
      rowSpan: 2,
    });
  }

  if (input.github_handle !== undefined) {
    const github = findTyped(blocks, "github");
    if (github) {
      await store.updateBlockData(userId, github.id, {
        ...asRecord(github.data),
        username: input.github_handle.trim(),
      });
    }
  }

  if (input.links) {
    const social = findTyped(blocks, "social");
    if (social) {
      await store.updateBlockData(userId, social.id, { ...asRecord(social.data), links: input.links });
    } else {
      await store.insertBlock(userId, {
        type: "social",
        data: { links: input.links },
        boardIndex,
        colSpan: 1,
        rowSpan: 1,
      });
    }
  }

  if (input.stack) {
    const stack = findTyped(blocks, "stack");
    if (stack) {
      await store.updateBlockData(userId, stack.id, { ...asRecord(stack.data), items: input.stack });
    } else {
      await store.insertBlock(userId, {
        type: "stack",
        data: { items: input.stack },
        boardIndex,
        colSpan: 1,
        rowSpan: 1,
      });
    }
  }

  await store.insertActivity(userId, "profile_update", {
    updatedFields: Object.keys({ ...columnPatch, ...(input.bio !== undefined ? { bio: true } : {}), ...(input.image_focus !== undefined ? { image_focus: true } : {}), ...(input.links ? { links: true } : {}), ...(input.stack ? { stack: true } : {}) }),
    source: "mcp",
  });
  await store.recomputeScore(userId);

  return getMyProfile(store, userId);
}

export async function listMyProjects(store: McpStore, userId: string): Promise<ToolOutcome> {
  const blocks = mainBlocks(await store.listMainBlocks(userId));
  return {
    ok: true,
    data: { projects: blocks.filter((block) => block.type === "project").map(projectView) },
  };
}

export async function createProject(store: McpStore, userId: string, raw: unknown): Promise<ToolOutcome> {
  const parsed = createProjectInputSchema.safeParse(raw);
  if (!parsed.success) return toolError("invalid", parsed.error.issues.map((issue) => issue.message).join(" "));
  const profile = await loadProfile(store, userId);
  if ("ok" in profile) return profile;
  const boardIndex = boardIndexOf(profile);
  const room = await ensureBlockRoom(store, profile, boardIndex);
  if (room) return room;

  const data: Record<string, unknown> = {
    title: parsed.data.title,
    description: parsed.data.description || "",
    link: parsed.data.link || "",
    stack: parsed.data.stack || [],
    status: parsed.data.status || "idea",
    metrics: parsed.data.metrics || "",
    launchDate: parsed.data.launchDate || "",
    imageUrl: parsed.data.imageUrl || "",
    archived: parsed.data.archived === true,
  };
  if (parsed.data.faviconUrl !== undefined) data.faviconUrl = parsed.data.faviconUrl;
  if (parsed.data.imageMode !== undefined) data.imageMode = parsed.data.imageMode;
  if (parsed.data.showStatus !== undefined) data.showStatus = parsed.data.showStatus;
  if (parsed.data.boxStyle !== undefined) data.boxStyle = parsed.data.boxStyle;

  const block = await store.insertBlock(userId, {
    type: "project",
    data,
    boardIndex,
    colSpan: 1,
    rowSpan: 2,
  });
  await store.insertActivity(userId, "new_block", { blockType: "project", blockId: block.id, source: "mcp" });
  await store.recomputeScore(userId);
  return { ok: true, data: { project: projectView(block) } };
}

function pickProjectPatch(input: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const key of PROJECT_DATA_KEYS) {
    if (input[key] !== undefined) patch[key] = input[key];
  }
  return patch;
}

export async function updateProject(store: McpStore, userId: string, raw: unknown): Promise<ToolOutcome> {
  const parsed = updateProjectInputSchema.safeParse(raw);
  if (!parsed.success) return toolError("invalid", parsed.error.issues.map((issue) => issue.message).join(" "));
  if (!Object.entries(parsed.data).some(([key, value]) => key !== "project_id" && value !== undefined)) {
    return toolError("invalid", "Nada para actualizar.");
  }
  const blocks = mainBlocks(await store.listMainBlocks(userId));
  const current = blocks.find((block) => block.id === parsed.data.project_id && block.type === "project");
  if (!current || current.user_id !== userId) return toolError("not_found", "No encontramos ese proyecto en tu perfil.");

  const nextData = { ...asRecord(current.data), ...pickProjectPatch(parsed.data) };
  const updated = await store.updateBlockData(userId, current.id, nextData);
  if (!updated) return toolError("not_found", "No encontramos ese proyecto en tu perfil.");

  const activity = await store.insertActivity(userId, "block_update", {
    blockType: "project",
    blockId: updated.id,
    source: "mcp",
  });
  await store.recomputeScore(userId);
  return {
    ok: true,
    data: { project: projectView(updated), ...avancesFlag(updated, activity.created_at) },
  };
}

export async function deleteProject(store: McpStore, userId: string, raw: unknown): Promise<ToolOutcome> {
  const idCheck = deleteProjectInputSchema.pick({ project_id: true }).safeParse(raw);
  if (!idCheck.success) return toolError("invalid", "project_id tiene que ser el id del proyecto.");
  const parsed = deleteProjectInputSchema.safeParse(raw);
  if (!parsed.success) {
    return toolError("confirm_required", "Para borrar un proyecto tenés que mandar confirm: true.");
  }
  const blocks = mainBlocks(await store.listMainBlocks(userId));
  const current = blocks.find((block) => block.id === parsed.data.project_id && block.type === "project");
  if (!current || current.user_id !== userId) return toolError("not_found", "No encontramos ese proyecto en tu perfil.");
  const removed = await store.deleteProject(userId, current.id);
  if (!removed) return toolError("not_found", "No encontramos ese proyecto en tu perfil.");
  await store.recomputeScore(userId);
  return { ok: true, data: { deleted: true, project_id: current.id } };
}

export async function postUpdate(store: McpStore, userId: string, raw: unknown): Promise<ToolOutcome> {
  const parsed = postUpdateInputSchema.safeParse(raw);
  if (!parsed.success) return toolError("invalid", parsed.error.issues.map((issue) => issue.message).join(" "));
  const blocks = mainBlocks(await store.listMainBlocks(userId));
  const current = blocks.find(
    (block) => block.id === parsed.data.project_id && (block.type === "project" || block.type === "building")
  );
  if (!current || current.user_id !== userId) {
    return toolError("not_found", "No encontramos ese proyecto en tu perfil.");
  }

  const data = asRecord(current.data);
  const next: Record<string, unknown> = {
    ...data,
    publicUpdate: { text: parsed.data.note, at: new Date().toISOString() },
  };
  if (parsed.data.set_description || (typeof data.description === "string" ? data.description.trim() === "" : !data.description)) {
    next.description = parsed.data.note;
  }
  const updated = await store.updateBlockData(userId, current.id, next);
  if (!updated) return toolError("not_found", "No encontramos ese proyecto en tu perfil.");

  const activity = await store.insertActivity(userId, "block_update", {
    blockType: updated.type,
    blockId: updated.id,
    source: "mcp",
  });
  await store.recomputeScore(userId);
  return {
    ok: true,
    data: {
      project_id: updated.id,
      note: parsed.data.note,
      ...avancesFlag(updated, activity.created_at),
    },
  };
}

export async function announceLaunch(store: McpStore, userId: string, raw: unknown): Promise<ToolOutcome> {
  const parsed = announceLaunchInputSchema.safeParse(raw);
  if (!parsed.success) return toolError("invalid", parsed.error.issues.map((issue) => issue.message).join(" "));
  const profile = await loadProfile(store, userId);
  if ("ok" in profile) return profile;
  const isPro = launchPlanIsPro(profile);
  const week = parsed.data.week || currentLaunchWeek();
  const cmp = compareWeeks(week, currentLaunchWeek());
  if (cmp < 0) return toolError("past_week", "No se puede lanzar en una semana que ya pasó.");
  if (cmp > 0 && !isPro) return toolError("pro_required", "Programar un lanzamiento futuro es una función Pro.");

  const result = await store.createLaunch(parsed.data.project_id, userId, week, isPro);
  if (!result.ok) {
    const messages: Record<string, string> = {
      not_owner: "No encontramos ese proyecto en tu perfil, o no es un bloque de proyecto.",
      no_link: "El proyecto necesita un link http(s) para lanzarse.",
      already_launched: "Ese proyecto ya está lanzado en esa semana.",
      monthly_limit: "En el plan free hay un lanzamiento por mes.",
      missing_table: "Builders Hunt todavía no está disponible.",
    };
    return toolError(result.error, messages[result.error] || "No se pudo lanzar.");
  }
  return {
    ok: true,
    data: {
      launch_id: result.launchId,
      week,
      counts_for_avances: cmp === 0,
      avances_reason: cmp === 0 ? null : "scheduled",
    },
  };
}

export async function arrangeBlocks(store: McpStore, userId: string, raw: unknown): Promise<ToolOutcome> {
  const parsed = arrangeBlocksInputSchema.safeParse(raw ?? {});
  if (!parsed.success) return toolError("invalid", parsed.error.issues.map((issue) => issue.message).join(" "));
  const input = parsed.data;
  if (!input.tidy && !(input.blocks && input.blocks.length > 0)) {
    return toolError("invalid", "Mandá tidy: true o una lista de blocks para acomodar.");
  }
  const profile = await loadProfile(store, userId);
  if ("ok" in profile) return profile;
  const boardIndex = boardIndexOf(profile);
  const board = boardBlocks(await store.listMainBlocks(userId), boardIndex);
  const byId = new Map(board.map((block) => [block.id, block]));

  const plan = input.tidy ? planTidy(board, { keepSizes: input.keep_sizes === true }) : { layout: new Map<string, LayoutPatch>(), data: new Map<string, Record<string, unknown>>(), notes: [] as string[] };
  for (const change of input.blocks || []) {
    if (!byId.has(change.id)) return toolError("not_found", `No encontramos el bloque ${change.id} en tu perfil publicado.`);
    const { id, ...patch } = change;
    const clean = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)) as LayoutPatch;
    plan.layout.set(id, { ...(plan.layout.get(id) || {}), ...clean });
  }

  // Cómo queda: el cupo de bloques visibles y un solo hero visible.
  const after = board.map((block) => applyPatch(block, plan.layout.get(block.id)));
  const visibleAfter = after.filter((block) => block.visible);
  const turnedOn = after.filter((block) => block.visible && !byId.get(block.id)!.visible).length;
  const limit = effectiveBlockLimit(profile);
  if (turnedOn > 0 && visibleAfter.length > limit) {
    return toolError("limit", `Límite de bloques alcanzado (${limit}).`);
  }
  if (visibleAfter.filter((block) => block.type === "hero").length > 1) {
    return toolError("duplicate_hero", "Quedarían dos bloques de perfil visibles. Ocultá uno.");
  }

  const changed: Array<{ id: string; type: string; fields: string[] }> = [];
  for (const [id, patch] of Array.from(plan.layout.entries())) {
    const current = byId.get(id)!;
    const diff = Object.fromEntries(
      Object.entries(patch).filter(([key, value]) => current[key as keyof LayoutPatch] !== value)
    ) as LayoutPatch;
    if (Object.keys(diff).length === 0) continue;
    await store.updateBlockLayout(userId, id, diff);
    changed.push({ id, type: current.type, fields: Object.keys(diff) });
  }
  for (const [id, data] of Array.from(plan.data.entries())) {
    await store.updateBlockData(userId, id, data);
    const entry = changed.find((item) => item.id === id);
    if (entry) entry.fields.push("data");
    else changed.push({ id, type: byId.get(id)!.type, fields: ["data"] });
  }

  if (changed.length > 0) {
    await store.insertActivity(userId, "profile_update", { updatedFields: ["block_layout"], source: "mcp" });
    await store.recomputeScore(userId);
  }
  const fresh = boardBlocks(await store.listMainBlocks(userId), boardIndex);
  return {
    ok: true,
    data: {
      changed,
      notes: plan.notes,
      grid: layoutView(fresh),
    },
  };
}

export async function syncFromGithub(store: McpStore, userId: string, raw: unknown): Promise<ToolOutcome> {
  const parsed = syncGithubInputSchema.safeParse(raw ?? {});
  if (!parsed.success) return toolError("invalid", parsed.error.issues.map((issue) => issue.message).join(" "));
  const result = await store.syncGithub(userId, { blockId: parsed.data.block_id, force: parsed.data.force === true });
  if (result.updated.length > 0) await store.recomputeScore(userId);
  return {
    ok: true,
    data: {
      updated: result.updated,
      hint: result.updated.length === 0
        ? "No había un bloque de GitHub para refrescar, o las stats ya estaban al día. sync_from_github no crea el bloque."
        : undefined,
    },
  };
}

type ToolHandler = (store: McpStore, userId: string, args: unknown) => Promise<ToolOutcome>;

// Saca dry_run de los argumentos. Con dry_run: true, el handler corre igual
// pero contra un store que no persiste, y la respuesta trae la vista previa.
function withDryRun(handler: ToolHandler): ToolHandler {
  return (store, userId, args) => {
    const { dry_run: dryRun, ...rest } = asRecord(args);
    if (dryRun === true) return runDryRun(store, (preview) => handler(preview, userId, rest));
    return handler(store, userId, rest);
  };
}

export type McpToolName =
  | "get_my_profile"
  | "update_profile"
  | "list_my_projects"
  | "create_project"
  | "update_project"
  | "delete_project"
  | "post_update"
  | "announce_launch"
  | "sync_from_github"
  | "arrange_blocks";

export const MCP_TOOL_NAMES: McpToolName[] = [
  "get_my_profile",
  "update_profile",
  "list_my_projects",
  "create_project",
  "update_project",
  "delete_project",
  "post_update",
  "announce_launch",
  "sync_from_github",
  "arrange_blocks",
];

export const MCP_TOOLS: Array<{
  name: McpToolName;
  description: string;
  inputSchema: ZodTypeAny;
  handler: (store: McpStore, userId: string, args: unknown) => Promise<ToolOutcome>;
}> = [
  {
    name: "get_my_profile",
    description: "Devuelve el perfil del dueño del token: headline, bio, links, stack, proyectos, profile_layout, link_box_style, el cupo de bloques y grid (todos los bloques del perfil publicado con orden y tamaño, más los problemas que encontró: bloques duplicados, huecos en la grilla, textos de ejemplo, links vacíos). No lee perfiles ajenos.",
    inputSchema: emptyInputSchema,
    handler: (store, userId) => getMyProfile(store, userId),
  },
  {
    name: "update_profile",
    description: "Actualiza el perfil propio. Acepta name, tagline (headline), bio, location, country, roles, available, github_handle, accent_color, layout, image, border_radius, profile_layout (portfolio o links), link_box_style (pill, card, compact, featured o expandable), links, stack e image_focus (encuadre de la foto: x, y de 0 a 100 y zoom de 1 a 3). Usa los mismos límites que el dashboard. No cambia username, email, dominio ni la newsletter. Con dry_run: true devuelve cómo quedaría sin guardar nada.",
    inputSchema: updateProfileInputSchema,
    handler: withDryRun((store, userId, args) => updateProfile(store, userId, args)),
  },
  {
    name: "list_my_projects",
    description: "Lista los proyectos del perfil principal del dueño del token.",
    inputSchema: emptyInputSchema,
    handler: (store, userId) => listMyProjects(store, userId),
  },
  {
    name: "create_project",
    description: "Crea un proyecto en el perfil principal. Respeta el cupo de bloques visibles del plan (5 en free, 22 en Pro, más los bloques extra por compartir). boxStyle es opcional: pill, card, compact, featured o expandable.",
    inputSchema: createProjectInputSchema,
    handler: withDryRun((store, userId, args) => createProject(store, userId, args)),
  },
  {
    name: "update_project",
    description: "Actualiza un proyecto propio. Acepta boxStyle (pill, card, compact, featured, expandable o null para usar el formato global). Deja una actividad block_update para que el cron de avances builders pueda contarla, si el bloque es público y no es el eco de haberlo creado recién.",
    inputSchema: updateProjectInputSchema,
    handler: withDryRun((store, userId, args) => updateProject(store, userId, args)),
  },
  {
    name: "delete_project",
    description: "Borra un proyecto propio. Hay que pasar confirm: true. Si no, no borra nada.",
    inputSchema: deleteProjectInputSchema,
    handler: withDryRun((store, userId, args) => deleteProject(store, userId, args)),
  },
  {
    name: "post_update",
    description: "Publica un avance de build in public sobre un proyecto o un bloque building del perfil principal. Escribe la nota y una actividad block_update, que es lo que mira el cron de avances builders. Si el bloque tiene menos de 2 horas, el cron lo ignora como eco de la creación.",
    inputSchema: postUpdateInputSchema,
    handler: withDryRun((store, userId, args) => postUpdate(store, userId, args)),
  },
  {
    name: "announce_launch",
    description: "Lanza un proyecto en Builders Hunt, en la semana actual o en una futura si el plan es Pro. Free: un lanzamiento por mes calendario. El proyecto necesita un link http(s).",
    inputSchema: announceLaunchInputSchema,
    handler: (store, userId, args) => announceLaunch(store, userId, args),
  },
  {
    name: "arrange_blocks",
    description: "Acomoda la grilla del perfil publicado. Con tidy: true oculta bloques duplicados (por ejemplo dos hero con la misma bio), saca links vacíos del bloque de redes, ordena los bloques y ajusta tamaños para que no queden huecos. Con blocks podés mover, redimensionar (col_span 1-4, row_span 1-4) u ocultar/mostrar bloques puntuales. No borra nada: lo duplicado queda oculto. Con dry_run: true devuelve cómo quedaría sin guardar.",
    inputSchema: arrangeBlocksInputSchema,
    handler: withDryRun((store, userId, args) => arrangeBlocks(store, userId, args)),
  },
  {
    name: "sync_from_github",
    description: "Refresca las stats públicas de los bloques de GitHub que ya están en el perfil. No crea el bloque y no pisa stats buenas con ceros.",
    inputSchema: syncGithubInputSchema,
    handler: (store, userId, args) => syncFromGithub(store, userId, args),
  },
];
