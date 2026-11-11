// Picker, copy and guards for the builder-updates cron.
// Pure aside from runAvancesBuilders, which takes a store and publishers
// so tests never touch the network or the database.
//
// Public profile fields only: username, name, visible project/building
// blocks. No email, score, subscription or private analytics.

export const AVANCES_SITE = "https://huevsite.io";

export const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const COOLDOWN_MS = 21 * 24 * 60 * 60 * 1000;
const CREATE_ECHO_MS = 2 * 60 * 60 * 1000;
const ART_OFFSET_MS = 3 * 60 * 60 * 1000;
const X_LIMIT = 280;
const X_URL_WEIGHT = 23;

export type SourceType = "launch" | "new_project" | "update";
export type LogStatus = "posted" | "skipped" | "failed" | "preview";

export interface AvanceCandidate {
  sourceType: SourceType;
  sourceId: string;
  userId: string;
  username: string;
  name: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  featured: boolean;
  upvoteCount: number;
  at: string;
}

export interface PostedLog {
  userId: string | null;
  sourceType: string | null;
  sourceId: string | null;
  publishedAt: string | null;
  runDate: string;
  status: string;
}

export interface PublicBlock {
  id: string;
  user_id: string;
  type: string;
  data: Record<string, unknown> | null;
  visible: boolean | null;
  sub_site_id: string | null;
  created_at: string;
}

export interface PublicProfile {
  id: string;
  username: string | null;
  name: string | null;
}

export interface LaunchRow {
  id: string;
  block_id: string;
  user_id: string;
  upvote_count: number | null;
  featured: boolean | null;
  launched_at: string | null;
  created_at: string | null;
  launch_week: string | null;
  scheduled: boolean | null;
}

export interface ActivityRow {
  id: string;
  user_id: string;
  created_at: string;
  data: Record<string, unknown> | null;
}

export interface ChannelTexts {
  x: string;
  instagram: string;
  linkedin: string;
  founderCta: boolean;
}

export interface AvancesLogInsert {
  runDate: string;
  userId: string | null;
  builderUsername: string | null;
  sourceType: SourceType | null;
  sourceId: string | null;
  title: string | null;
  imageUrl: string | null;
  includeFounderCta: boolean;
  status: LogStatus;
  skipReason: string | null;
  payload: Record<string, unknown> | null;
  publishedAt: string | null;
  xResult: string | null;
  linkedinResult: string | null;
  instagramResult: string | null;
}

export type ChannelAttempt =
  | { status: "posted"; id: string }
  | { status: "skipped_no_config" }
  | { status: "error"; message: string };

export interface AvancesPublishers {
  xConfigured: boolean;
  linkedinConfigured: boolean;
  instagramConfigured: boolean;
  resolveXMention(username: string): Promise<string | null>;
  sendTweet(text: string): Promise<ChannelAttempt>;
  postLinkedIn(text: string): Promise<ChannelAttempt>;
  postInstagram(input: { text: string; imageUrl: string; alt: string }): Promise<ChannelAttempt>;
  imageReachable(url: string): Promise<boolean>;
  founderRemaining(): Promise<number>;
}

export interface AvancesStore {
  loadCandidates(sinceIso: string): Promise<AvanceCandidate[]>;
  loadPosted(): Promise<PostedLog[]>;
  socialLinks(userId: string): Promise<{ platform?: string; url?: string }[]>;
  insertLog(row: AvancesLogInsert): Promise<{ ok: true } | { ok: false; code: string }>;
}

export interface AvancesRunResult {
  ok: true;
  skipped: boolean;
  reason: string | null;
  pick: {
    sourceType: SourceType;
    sourceId: string;
    username: string;
    title: string;
    url: string;
  } | null;
  texts: { x: string; instagram: string; linkedin: string } | null;
  imageUrl: string | null;
  founderCta: boolean;
  results: { x: string; linkedin: string; instagram: string } | null;
}

export function artRunDate(now: Date): string {
  const art = new Date(now.getTime() - ART_OFFSET_MS);
  const y = art.getUTCFullYear();
  const m = String(art.getUTCMonth() + 1).padStart(2, "0");
  const d = String(art.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isArtFriday(now: Date): boolean {
  return new Date(now.getTime() - ART_OFFSET_MS).getUTCDay() === 5;
}

export function isAvancesEnabled(value: string | undefined): boolean {
  return value === "true";
}

export function isAvancesDryRun(opts: {
  preview: string | null;
  dryRun: string | null;
  env: string | undefined;
}): boolean {
  return opts.preview === "1" || opts.dryRun === "1" || opts.env === "true";
}

export function isAvancesAuthorized(header: string | null, querySecret: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const adminSecret = process.env.ADMIN_SECRET;
  const isCron = !!cronSecret && header === `Bearer ${cronSecret}`;
  const isAdmin = !!querySecret && !!adminSecret && querySecret === adminSecret;
  return isCron || isAdmin;
}

export function redactForLog(value: unknown): string {
  const raw = value instanceof Error ? value.message : typeof value === "string" ? value : "error";
  return raw
    .replace(/bearer\s+\S+/gi, "bearer [redacted]")
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, "[jwt]")
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email]")
    .slice(0, 240);
}

export function xWeightedLength(text: string): number {
  const re = /https?:\/\/[^\s]+/g;
  let weight = 0;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    weight += match.index - last;
    weight += X_URL_WEIGHT;
    last = match.index + match[0].length;
  }
  return weight + (text.length - last);
}

export function oneLineDescription(raw: string | null | undefined, max = 120): string {
  if (!raw) return "";
  const line = raw.replace(/\s+/g, " ").trim();
  if (!line) return "";
  if (line.length <= max) return line;
  return `${line.slice(0, max - 1).trimEnd()}…`;
}

function collapse(value: string): string {
  const line = value.replace(/\s+/g, " ").trim();
  return line;
}

export function isPublicProjectBlock(block: {
  visible?: boolean | null;
  sub_site_id?: string | null;
  type?: string | null;
  data?: { archived?: unknown } | null;
}): boolean {
  if (block.visible !== true) return false;
  if (block.sub_site_id) return false;
  if (block.type !== "project" && block.type !== "building") return false;
  const archived = block.data?.archived;
  return archived !== true && archived !== "true";
}

export function isCreateEcho(blockCreatedAt: string, activityCreatedAt: string): boolean {
  const created = Date.parse(blockCreatedAt);
  const activity = Date.parse(activityCreatedAt);
  if (Number.isNaN(created) || Number.isNaN(activity)) return false;
  return Math.abs(activity - created) < CREATE_ECHO_MS;
}

export function publicProjectTitle(data: { title?: unknown; project?: unknown } | null | undefined): string {
  const title = typeof data?.title === "string" ? data.title.trim() : "";
  const project = typeof data?.project === "string" ? data.project.trim() : "";
  return collapse(title || project || "un proyecto");
}

export function publicProjectDescription(data: { description?: unknown } | null | undefined): string {
  const raw = typeof data?.description === "string" ? data.description : "";
  return oneLineDescription(raw);
}

export function profileUrl(username: string): string {
  return `${AVANCES_SITE}/${encodeURIComponent(username)}`;
}

export function profileOgUrl(username: string): string {
  return `${AVANCES_SITE}/api/og/${encodeURIComponent(username)}`;
}

// Imagen del post de IG: 4:5, centrada en el proyecto (ver app/api/og/avance).
export function avanceIgImageUrl(blockId: string, kind: SourceType, launchId?: string): string {
  const params = new URLSearchParams({ kind });
  if (launchId) params.set("launch", launchId);
  return `${AVANCES_SITE}/api/og/avance/${encodeURIComponent(blockId)}?${params.toString()}`;
}

export function launchShareUrl(id: string, week: string | null): string {
  const params = new URLSearchParams({ launch: id });
  if (week && /^\d{4}-W\d{2}$/.test(week)) params.set("week", week);
  return `${AVANCES_SITE}/feed?${params.toString()}`;
}

export function launchOgUrl(id: string): string {
  return `${AVANCES_SITE}/api/og/launch/${id}`;
}

export function isHuevsiteOgUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "huevsite.io" && parsed.pathname.startsWith("/api/og/");
  } catch {
    return false;
  }
}

function displayName(profile: PublicProfile): string | null {
  if (!profile.username) return null;
  return collapse(profile.name || profile.username);
}

export function launchCandidate(launch: LaunchRow, block: PublicBlock, profile: PublicProfile): AvanceCandidate | null {
  if (launch.scheduled) return null;
  if (launch.user_id !== profile.id || block.user_id !== profile.id) return null;
  if (block.id !== launch.block_id) return null;
  if (!isPublicProjectBlock(block)) return null;
  const name = displayName(profile);
  if (!name || !profile.username) return null;
  const at = launch.launched_at || launch.created_at;
  if (!at) return null;
  return {
    sourceType: "launch",
    sourceId: launch.id,
    userId: profile.id,
    username: profile.username,
    name,
    title: publicProjectTitle(block.data),
    description: publicProjectDescription(block.data),
    url: launchShareUrl(launch.id, launch.launch_week),
    imageUrl: avanceIgImageUrl(block.id, "launch", launch.id),
    featured: !!launch.featured,
    upvoteCount: launch.upvote_count || 0,
    at,
  };
}

export function projectCandidate(block: PublicBlock, profile: PublicProfile): AvanceCandidate | null {
  if (block.user_id !== profile.id) return null;
  if (!isPublicProjectBlock(block)) return null;
  const name = displayName(profile);
  if (!name || !profile.username || !block.created_at) return null;
  return {
    sourceType: "new_project",
    sourceId: block.id,
    userId: profile.id,
    username: profile.username,
    name,
    title: publicProjectTitle(block.data),
    description: publicProjectDescription(block.data),
    url: profileUrl(profile.username),
    imageUrl: avanceIgImageUrl(block.id, "new_project"),
    featured: false,
    upvoteCount: 0,
    at: block.created_at,
  };
}

export function updateCandidate(activity: ActivityRow, block: PublicBlock, profile: PublicProfile): AvanceCandidate | null {
  if (activity.user_id !== profile.id || block.user_id !== profile.id) return null;
  const blockType = activity.data?.blockType;
  if (blockType !== "project" && blockType !== "building") return null;
  const blockId = activity.data?.blockId;
  if (typeof blockId !== "string" || blockId !== block.id) return null;
  if (!isPublicProjectBlock(block)) return null;
  if (isCreateEcho(block.created_at, activity.created_at)) return null;
  const name = displayName(profile);
  if (!name || !profile.username) return null;
  return {
    sourceType: "update",
    sourceId: block.id,
    userId: profile.id,
    username: profile.username,
    name,
    title: publicProjectTitle(block.data),
    description: publicProjectDescription(block.data),
    url: profileUrl(profile.username),
    imageUrl: avanceIgImageUrl(block.id, "update"),
    featured: false,
    upvoteCount: 0,
    at: activity.created_at,
  };
}

function inWindow(iso: string, now: Date): boolean {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return false;
  const age = now.getTime() - time;
  return age >= 0 && age <= WINDOW_MS;
}

function inCooldown(iso: string, now: Date): boolean {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return false;
  const age = now.getTime() - time;
  return age >= 0 && age < COOLDOWN_MS;
}

function compareCandidates(type: SourceType) {
  return (a: AvanceCandidate, b: AvanceCandidate) => {
    if (type === "launch") {
      const featured = Number(b.featured) - Number(a.featured);
      if (featured) return featured;
      const votes = b.upvoteCount - a.upvoteCount;
      if (votes) return votes;
    }
    return b.at.localeCompare(a.at);
  };
}

export function alreadyPostedToday(posted: PostedLog[], runDate: string): boolean {
  return posted.some((row) => row.status === "posted" && row.runDate === runDate);
}

export function withAdditionalPost(
  existingPayload: unknown,
  extra: {
    sourceType: string;
    sourceId: string;
    userId: string | null;
    publishedAt: string | null;
    xResult?: string | null;
    linkedinResult?: string | null;
    instagramResult?: string | null;
  }
): Record<string, unknown> {
  const payload =
    existingPayload && typeof existingPayload === "object" && !Array.isArray(existingPayload)
      ? { ...(existingPayload as Record<string, unknown>) }
      : {};
  const previous = Array.isArray(payload.additional) ? payload.additional.slice() : [];
  previous.push({
    sourceType: extra.sourceType,
    sourceId: extra.sourceId,
    userId: extra.userId,
    publishedAt: extra.publishedAt,
    xResult: extra.xResult ?? null,
    linkedinResult: extra.linkedinResult ?? null,
    instagramResult: extra.instagramResult ?? null,
  });
  return { ...payload, additional: previous };
}

export function postedLogsFromRows(
  rows: Array<PostedLog & { payload?: unknown }>
): PostedLog[] {
  const logs: PostedLog[] = [];
  for (const row of rows) {
    logs.push({
      userId: row.userId,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      publishedAt: row.publishedAt,
      runDate: row.runDate,
      status: row.status,
    });
    if (!row.payload || typeof row.payload !== "object" || Array.isArray(row.payload)) continue;
    const additional = (row.payload as { additional?: unknown }).additional;
    if (!Array.isArray(additional)) continue;
    for (const item of additional) {
      if (!item || typeof item !== "object") continue;
      const extra = item as { userId?: unknown; sourceType?: unknown; sourceId?: unknown; publishedAt?: unknown };
      logs.push({
        userId: typeof extra.userId === "string" ? extra.userId : null,
        sourceType: typeof extra.sourceType === "string" ? extra.sourceType : null,
        sourceId: typeof extra.sourceId === "string" ? extra.sourceId : null,
        publishedAt: typeof extra.publishedAt === "string" ? extra.publishedAt : null,
        runDate: row.runDate,
        status: "posted",
      });
    }
  }
  return logs;
}

export function chooseAvance(input: {
  now: Date;
  candidates: AvanceCandidate[];
  posted: PostedLog[];
}): { pick: AvanceCandidate | null; reason: "no_signal" | null } {
  const cooled = new Set(
    input.posted
      .filter((row) => row.status === "posted" && row.userId && row.publishedAt && inCooldown(row.publishedAt, input.now))
      .map((row) => row.userId as string)
  );
  const used = new Set(
    input.posted
      .filter((row) => row.status === "posted" && row.sourceType && row.sourceId)
      .map((row) => `${row.sourceType}:${row.sourceId}`)
  );

  const fresh = input.candidates.filter((candidate) => {
    if (!inWindow(candidate.at, input.now)) return false;
    if (cooled.has(candidate.userId)) return false;
    if (used.has(`${candidate.sourceType}:${candidate.sourceId}`)) return false;
    return true;
  });

  for (const type of ["launch", "new_project", "update"] as const) {
    const group = fresh.filter((candidate) => candidate.sourceType === type).sort(compareCandidates(type));
    if (group[0]) return { pick: group[0], reason: null };
  }
  return { pick: null, reason: "no_signal" };
}

const IG_RESERVED = new Set(["p", "reel", "reels", "stories", "explore", "accounts", "about", "direct"]);

export function parseInstagramHandle(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith("@")) {
    const handle = value.slice(1).split(/[/?#\s]/)[0];
    if (!handle || !/^[A-Za-z0-9._]+$/.test(handle)) return null;
    return `@${handle}`;
  }
  let url: URL;
  try {
    url = new URL(value.includes("://") ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host !== "instagram.com") return null;
  const segment = url.pathname.split("/").filter(Boolean)[0];
  if (!segment || IG_RESERVED.has(segment.toLowerCase())) return null;
  if (!/^[A-Za-z0-9._]+$/.test(segment)) return null;
  return `@${segment}`;
}

export function instagramHandleFromLinks(links: { platform?: string; url?: string }[] | null | undefined): string | null {
  if (!links) return null;
  for (const link of links) {
    if (link.platform !== "instagram" || !link.url) continue;
    const handle = parseInstagramHandle(link.url);
    if (handle) return handle;
  }
  return null;
}

export function xHandleFromMention(mention: string | null | undefined): string | null {
  if (!mention || !mention.startsWith("@")) return null;
  if (mention.includes("/") || mention.includes(" ")) return null;
  return mention;
}

function handleLine(handle: string | null): string {
  return handle ? ` (${handle})` : "";
}

function founderBlock(channel: "x" | "instagram" | "linkedin", remaining: number, runDate: string): string {
  return [
    `Si querés bancar la red: Founder lifetime a USD 79. Quedan ${remaining} lugares.`,
    `https://huevsite.io/precios?utm_source=${channel}&utm_medium=social&utm_campaign=avances_builders&utm_content=${runDate}`,
  ].join("\n");
}

function withFounder(body: string, channel: "x" | "instagram" | "linkedin", founder: { remaining: number; runDate: string } | null): string {
  if (!founder || !Number.isInteger(founder.remaining) || founder.remaining <= 0) return body;
  return `${body}\n\n${founderBlock(channel, founder.remaining, founder.runDate)}`;
}

function paragraphs(parts: Array<string | null | undefined | false>): string {
  return parts.filter((part): part is string => typeof part === "string" && part.trim().length > 0).join("\n\n");
}

function fitTweet(render: (title: string) => string, title: string): string {
  const full = render(title);
  if (xWeightedLength(full) <= X_LIMIT) return full;

  let lo = 0;
  let hi = title.length;
  let best = render("…");
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const trimmed = mid <= 0 ? "…" : mid >= title.length ? title : `${title.slice(0, mid).trimEnd()}…`;
    const built = render(trimmed);
    if (xWeightedLength(built) <= X_LIMIT) {
      best = built;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

export function buildCopy(input: {
  sourceType: SourceType;
  name: string;
  title: string;
  description?: string | null;
  url: string;
  xHandle: string | null;
  igHandle: string | null;
  founder: { remaining: number; runDate: string } | null;
}): ChannelTexts {
  const name = collapse(input.name) || "un builder";
  const title = collapse(input.title) || "un proyecto";
  const desc = oneLineDescription(input.description);
  const xLine = handleLine(xHandleFromMention(input.xHandle));
  const igLine = handleLine(input.igHandle && input.igHandle.startsWith("@") ? input.igHandle : null);
  const founder = input.founder && Number.isInteger(input.founder.remaining) && input.founder.remaining > 0 ? input.founder : null;

  let xBody: string;
  let igBody: string;
  let liBody: string;

  if (input.sourceType === "launch") {
    xBody = fitTweet(
      (short) =>
        withFounder(
          `${name}${xLine} lanzó ${short} en Builders Hunt.\n\nMirálo y votá:\n${input.url}\n\n#buildinpublic #BuildeaEnPublico`,
          "x",
          founder
        ),
      title
    );
    igBody = paragraphs([
      `${name}${igLine} lanzó ${title} en Builders Hunt.`,
      desc,
      `Entrá a votar: ${input.url}`,
      "#buildinpublic #BuildeaEnPublico",
    ]);
    liBody = paragraphs([
      `${name} lanzó ${title} en Builders Hunt, el feed de lanzamientos de huevsite.io.`,
      desc,
      input.url,
    ]);
  } else if (input.sourceType === "new_project") {
    xBody = fitTweet(
      (short) =>
        withFounder(
          `${name}${xLine} cargó un proyecto nuevo en huevsite: ${short}\n\n${input.url}\n\n#buildinpublic #BuildeaEnPublico`,
          "x",
          founder
        ),
      title
    );
    igBody = paragraphs([
      `${name}${igLine} cargó un proyecto nuevo en su huevsite: ${title}`,
      desc,
      input.url,
      "#buildinpublic #BuildeaEnPublico",
    ]);
    liBody = paragraphs([`${name} sumó un proyecto nuevo a su huevsite: ${title}`, desc, input.url]);
  } else {
    xBody = fitTweet(
      (short) =>
        withFounder(
          `${name}${xLine} actualizó ${short} en su huevsite.\n\n${input.url}\n\n#buildinpublic #BuildeaEnPublico`,
          "x",
          founder
        ),
      title
    );
    igBody = paragraphs([
      `${name}${igLine} actualizó ${title} en su huevsite.`,
      desc,
      input.url,
      "#buildinpublic #BuildeaEnPublico",
    ]);
    liBody = paragraphs([`${name} actualizó ${title} en su huevsite.`, desc, input.url]);
  }

  return {
    x: xBody,
    instagram: withFounder(igBody, "instagram", founder),
    linkedin: withFounder(liBody, "linkedin", founder),
    founderCta: !!founder,
  };
}

export function buildLogPayload(
  pick: AvanceCandidate,
  extra: {
    texts: ChannelTexts;
    xHandle: string | null;
    igHandle: string | null;
    founderRemaining: number | null;
  }
): Record<string, unknown> {
  return {
    sourceType: pick.sourceType,
    sourceId: pick.sourceId,
    username: pick.username,
    name: pick.name,
    title: pick.title,
    url: pick.url,
    imageUrl: pick.imageUrl,
    xHandle: xHandleFromMention(extra.xHandle),
    igHandle: extra.igHandle && extra.igHandle.startsWith("@") ? extra.igHandle : null,
    texts: {
      x: extra.texts.x,
      instagram: extra.texts.instagram,
      linkedin: extra.texts.linkedin,
    },
    founderCta: extra.texts.founderCta,
    founderRemaining: extra.founderRemaining,
  };
}

function skippedResult(reason: string): AvancesRunResult {
  return {
    ok: true,
    skipped: true,
    reason,
    pick: null,
    texts: null,
    imageUrl: null,
    founderCta: false,
    results: null,
  };
}

export function disabledAvancesResult(): AvancesRunResult {
  return skippedResult("disabled");
}

function formatAttempt(attempt: ChannelAttempt): string {
  if (attempt.status === "posted") return `posted:${attempt.id}`;
  if (attempt.status === "skipped_no_config") return "skipped_no_config";
  return `error:${attempt.message}`;
}

function emptyLog(runDate: string, status: LogStatus, skipReason: string | null): AvancesLogInsert {
  return {
    runDate,
    userId: null,
    builderUsername: null,
    sourceType: null,
    sourceId: null,
    title: null,
    imageUrl: null,
    includeFounderCta: false,
    status,
    skipReason,
    payload: null,
    publishedAt: null,
    xResult: null,
    linkedinResult: null,
    instagramResult: null,
  };
}

async function safeAttempt(run: () => Promise<ChannelAttempt>): Promise<string> {
  try {
    return formatAttempt(await run());
  } catch (error) {
    return `error:${redactForLog(error)}`;
  }
}

async function publishChannels(
  publishers: AvancesPublishers,
  texts: ChannelTexts,
  pick: AvanceCandidate,
  dryRun: boolean
): Promise<{ x: string; linkedin: string; instagram: string }> {
  const idle = (configured: boolean) => (dryRun ? (configured ? "dry_run" : "skipped_no_config") : null);

  const xIdle = idle(publishers.xConfigured);
  const x = xIdle ?? (publishers.xConfigured ? await safeAttempt(() => publishers.sendTweet(texts.x)) : "skipped_no_config");

  const liIdle = idle(publishers.linkedinConfigured);
  const linkedin =
    liIdle ?? (publishers.linkedinConfigured ? await safeAttempt(() => publishers.postLinkedIn(texts.linkedin)) : "skipped_no_config");

  let instagram: string;
  const igIdle = idle(publishers.instagramConfigured);
  if (igIdle) {
    instagram = igIdle;
  } else if (!publishers.instagramConfigured) {
    instagram = "skipped_no_config";
  } else if (!isHuevsiteOgUrl(pick.imageUrl)) {
    instagram = "skipped_image";
  } else {
    let reachable = false;
    try {
      reachable = await publishers.imageReachable(pick.imageUrl);
    } catch {
      reachable = false;
    }
    if (!reachable) {
      instagram = "skipped_image";
    } else {
      instagram = await safeAttempt(() =>
        publishers.postInstagram({
          text: texts.instagram,
          imageUrl: pick.imageUrl,
          alt: pick.title.slice(0, 120) || "huevsite",
        })
      );
    }
  }

  return { x, linkedin, instagram };
}

function runStatus(results: { x: string; linkedin: string; instagram: string }, dryRun: boolean): LogStatus {
  if (dryRun) return "preview";
  const values = [results.x, results.linkedin, results.instagram];
  if (values.some((value) => value.startsWith("posted:"))) return "posted";
  return "failed";
}

export async function runAvancesBuilders(args: {
  now?: Date;
  dryRun: boolean;
  force: boolean;
  enabled: boolean;
  store: AvancesStore;
  publishers: AvancesPublishers;
}): Promise<AvancesRunResult> {
  const now = args.now ?? new Date();
  if (!args.enabled && !args.dryRun) return skippedResult("disabled");

  const runDate = artRunDate(now);
  const since = new Date(now.getTime() - WINDOW_MS).toISOString();
  const [candidates, posted] = await Promise.all([args.store.loadCandidates(since), args.store.loadPosted()]);

  if (!args.force && alreadyPostedToday(posted, runDate)) return skippedResult("already_ran");

  const choice = chooseAvance({ now, candidates, posted });
  if (!choice.pick) {
    await args.store.insertLog(emptyLog(runDate, "skipped", "no_signal"));
    return skippedResult("no_signal");
  }

  const pick = choice.pick;
  let mention: string | null = null;
  try {
    mention = await args.publishers.resolveXMention(pick.username);
  } catch {
    mention = null;
  }
  let links: { platform?: string; url?: string }[] = [];
  try {
    links = await args.store.socialLinks(pick.userId);
  } catch {
    links = [];
  }
  const xHandle = xHandleFromMention(mention);
  const igHandle = instagramHandleFromLinks(links);

  let founderRemaining: number | null = null;
  if (isArtFriday(now)) {
    try {
      const remaining = await args.publishers.founderRemaining();
      founderRemaining = Number.isInteger(remaining) && remaining >= 0 ? remaining : null;
    } catch {
      founderRemaining = null;
    }
  }
  const founder = founderRemaining !== null && founderRemaining > 0 ? { remaining: founderRemaining, runDate } : null;
  const texts = buildCopy({
    sourceType: pick.sourceType,
    name: pick.name,
    title: pick.title,
    description: pick.description,
    url: pick.url,
    xHandle,
    igHandle,
    founder,
  });

  const results = await publishChannels(args.publishers, texts, pick, args.dryRun);
  const status = runStatus(results, args.dryRun);
  const saved = await args.store.insertLog({
    runDate,
    userId: pick.userId,
    builderUsername: pick.username,
    sourceType: pick.sourceType,
    sourceId: pick.sourceId,
    title: pick.title,
    imageUrl: pick.imageUrl,
    includeFounderCta: texts.founderCta,
    status,
    skipReason: null,
    payload: buildLogPayload(pick, { texts, xHandle, igHandle, founderRemaining }),
    publishedAt: status === "posted" ? now.toISOString() : null,
    xResult: results.x,
    linkedinResult: results.linkedin,
    instagramResult: results.instagram,
  });
  if (!saved.ok) console.error("[avances-builders] log", saved.code);

  return {
    ok: true,
    skipped: false,
    reason: status === "failed" ? "publish_failed" : null,
    pick: {
      sourceType: pick.sourceType,
      sourceId: pick.sourceId,
      username: pick.username,
      title: pick.title,
      url: pick.url,
    },
    texts: { x: texts.x, instagram: texts.instagram, linkedin: texts.linkedin },
    imageUrl: pick.imageUrl,
    founderCta: texts.founderCta,
    results,
  };
}
