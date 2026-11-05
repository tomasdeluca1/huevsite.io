import snapshot from "../data/snapshot.json";

export type Project = {
  title: string;
  description: string;
  status: string | null;
  stack: string[];
  username: string;
  name: string;
  country: string | null;
  avatarFile: string | null;
};

export type BuilderCard = {
  username: string;
  name: string;
  tagline: string | null;
  country: string | null;
  location: string | null;
  avatarFile: string | null;
  isWinner: boolean;
};

export type CountryRow = {
  label: string;
  count: number;
  tone: "accent" | "slate";
  detail?: string;
};

export type LaunchRow = {
  title: string;
  username: string;
  name: string | null;
  upvoteCount: number;
  stack: string[];
};

export type WinnerRow = {
  username: string;
  name: string;
  week: string | null;
  tagline: string | null;
  avatarFile: string | null;
};

type RawProject = {
  title: string;
  description: string;
  status: string | null;
  stack: string[];
};

type RawBuilder = {
  username: string;
  name: string;
  avatarFile: string | null;
  tagline: string | null;
  projects: RawProject[];
  location: string | null;
  country: string | null;
  countryName: string | null;
  isWinner: boolean;
};

const raw = snapshot as {
  directory: {
    total: number;
    publicLabel: string;
    byCountry: { code: string; name: string; count: number }[];
    withoutCountry: number;
  };
  builders: RawBuilder[];
  weeklyWinners: { username: string; name: string; week: string | null; tagline: string | null }[];
  launches: {
    week: string | null;
    currentWeek: string | null;
    items: { title: string; username: string | null; name: string | null; upvoteCount: number; stack: string[] }[];
  };
};

const BAD_DESC = /descripci[oó]n breve|descripci[oó]n del proyecto|proyecto destacado importado/i;

function cleanLocation(location: string | null, countryName: string | null): string | null {
  if (!location) return countryName;
  const cleaned = location
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || countryName;
}

const avatarByUser = new Map(raw.builders.map((b) => [b.username.toLowerCase(), b.avatarFile]));
const taglineByUser = new Map(raw.builders.map((b) => [b.username.toLowerCase(), b.tagline]));

export const directoryTotal = raw.directory.total;
export const directoryLabel = raw.directory.publicLabel;
export const launchWeek = raw.launches.week;
export const currentLaunchWeek = raw.launches.currentWeek;

export const builders: BuilderCard[] = raw.builders.map((b) => ({
  username: b.username,
  name: b.name || b.username,
  tagline: b.tagline?.replace(/\s+/g, " ").trim() || null,
  country: b.country,
  location: cleanLocation(b.location, b.countryName),
  avatarFile: b.avatarFile,
  isWinner: b.isWinner,
}));

const JUNK_TAGLINE = /linktree|reci[eé]n llegado|^hola\.?$|^ai\.?$|^opa\.?$|^yo\.?$|^dev\.?$|^builder\.?$|^god\.?$/i;
/** Visible third-party typos. We drop the card; we don't rewrite their copy. */
const TYPO_TAGLINE = /caos organizado|caso organizado|enterepeneur/i;

function selectWall(skipTypos: boolean): BuilderCard[] {
  const readable = builders.filter((b) => {
    if (!b.avatarFile || !b.tagline) return false;
    if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(b.name)) return false;
    const tagline = b.tagline.trim();
    if (tagline.length <= 8 || JUNK_TAGLINE.test(tagline)) return false;
    if (skipTypos && TYPO_TAGLINE.test(tagline)) return false;
    return true;
  });
  const abroad = readable.filter((b) => b.country && b.country !== "AR");
  const home = readable.filter((b) => !abroad.includes(b));
  const out: BuilderCard[] = [];
  let i = 0;
  let j = 0;
  while (i < home.length || j < abroad.length) {
    for (let k = 0; k < 2 && i < home.length; k++) out.push(home[i++]);
    if (j < abroad.length) out.push(abroad[j++]);
  }
  return out;
}

/** Profiles with a real name, photo and tagline. Junk imports stay off the wall. */
export const wallBuilders: BuilderCard[] = selectWall(true);

/**
 * The 52 builders from the first cut. v2 keeps this roster (no new people).
 * Taglines with a visible typo still belong to that person; cards show them
 * as published and we don't rewrite the words.
 */
export const roster: BuilderCard[] = selectWall(false);

/** Ale Zanello is one of the 52. These are his public projects, used as the lone-builder story. */
export const soloBuilder: BuilderCard =
  roster.find((b) => b.username === "azanello") ?? roster[0];

export const soloProjects: { title: string; description: string; host: string }[] = [
  {
    title: "Portfolio",
    description: "Acceso completo a mi portfolio",
    host: "azanello.com",
  },
  {
    title: "Declarado",
    description: "Declaraciones juradas de funcionarios publicos con facil acceso",
    host: "declarado.azanello.com",
  },
  {
    title: "Cordoba Bondi Real-Time",
    description: "Mapa en tiempo real de los colectivos de la Ciudad de Cordoba",
    host: "calculadora.azanello.com",
  },
  {
    title: "Cordoba Risk Map",
    description: "Mapa iterativo estilo Cyberpunk de la ciudad de cordoba con zonas peligrosas",
    host: "cordoba.azanello.com",
  },
];

function bestProject(b: RawBuilder): Project | null {
  let best: Project | null = null;
  let bestScore = -1;
  for (const p of b.projects) {
    const description = (p.description || "").trim();
    if (!p.title || p.title.length < 3 || p.title.length > 58) continue;
    if (/^yo$/i.test(p.title.trim())) continue;
    if (!description || description.length < 20 || BAD_DESC.test(description)) continue;
    // "picsel es…" reads as "picseles" on a card. Leave the copy alone, pick another project.
    const visible = `${p.title} ${description}`;
    // On-screen typos from public copy. Skip the card; don't edit the words.
    if (/picsel|suplmenetos|enterepeneur|chianeable|sintomas/i.test(visible)) continue;
    const tech = (p.stack || []).join(" ").toLowerCase();
    const launched = /lanzado/i.test(p.status || "");
    let score = (launched ? 6 : 0) + Math.min((p.stack || []).length, 4);
    if (description.length > 50) score += 1;
    if (/\brust\b/.test(tech)) score += 3;
    if (/python/.test(tech)) score += 2;
    if (/\bgo\b/.test(tech)) score += 2;
    if (b.country && b.country !== "AR") score += 2;
    if (score <= bestScore) continue;
    bestScore = score;
    best = {
      title: p.title.trim(),
      description,
      status: p.status,
      stack: (p.stack || []).map((s) => s.trim()).filter(Boolean).slice(0, 3),
      username: b.username,
      name: b.name || b.username,
      country: b.country,
      avatarFile: b.avatarFile,
    };
  }
  return best;
}

export const featuredProjects: Project[] = (() => {
  const pool = raw.builders.map(bestProject).filter((p): p is Project => !!p);
  const picked: Project[] = [];
  const usedTech = new Set<string>();
  const take = (pred: (p: Project) => boolean) => {
    const matches = pool.filter((p) => !picked.includes(p) && pred(p));
    if (!matches.length) return false;
    matches.sort((a, b) => b.stack.length - a.stack.length || b.description.length - a.description.length);
    const row = matches[0];
    picked.push(row);
    const tech = (row.stack[0] || "").toLowerCase();
    if (tech) usedTech.add(tech);
    return true;
  };
  while (picked.length < 12) {
    const launched = picked.filter((p) => /lanzado/i.test(p.status || "")).length;
    const nonAr = picked.filter((p) => p.country && p.country !== "AR").length;
    const has = (re: RegExp) => picked.some((p) => re.test(p.stack.join(" ").toLowerCase()));
    if (launched < 5 && take((p) => /lanzado/i.test(p.status || ""))) continue;
    if (nonAr < 3 && take((p) => !!p.country && p.country !== "AR")) continue;
    if (!has(/\brust\b/) && take((p) => /\brust\b/.test(p.stack.join(" ").toLowerCase()))) continue;
    if (!has(/python/) && take((p) => /python/.test(p.stack.join(" ").toLowerCase()))) continue;
    if (!has(/\bgo\b/) && take((p) => /\bgo\b/.test(p.stack.join(" ").toLowerCase()))) continue;
    const fresh = pool.filter((p) => !picked.includes(p) && !usedTech.has((p.stack[0] || "").toLowerCase()));
    if (fresh.length && take((p) => fresh.includes(p))) continue;
    if (!take(() => true)) break;
  }
  return picked;
})();

export function statusLabel(status: string | null): { text: string; live: boolean } | null {
  if (!status) return null;
  if (/lanzado/i.test(status)) return { text: "lanzado", live: true };
  if (/construcci/i.test(status)) return { text: "en construcción", live: false };
  if (/idea/i.test(status)) return { text: "idea", live: false };
  return null;
}

const TOP = ["AR", "PE", "UY", "ES", "US"];
const topRows = TOP.map((code) => raw.directory.byCountry.find((c) => c.code === code)).filter(
  (c): c is { code: string; name: string; count: number } => !!c,
);
const other = raw.directory.byCountry.filter((c) => !TOP.includes(c.code));
const otherMulti = other.filter((c) => c.count > 1);
const otherSingles = other.filter((c) => c.count === 1);

export const countryRows: CountryRow[] = [
  ...topRows.map((c) => ({ label: c.name, count: c.count, tone: "accent" as const })),
  {
    label: "Otros países",
    count: other.reduce((sum, c) => sum + c.count, 0),
    tone: "accent",
    detail: `${otherMulti.map((c) => `${c.name} ${c.count}`).join(" · ")} · ${otherSingles.length} países con 1`,
  },
  { label: "Sin país público", count: raw.directory.withoutCountry, tone: "slate" },
];

export const launches: LaunchRow[] = (() => {
  const out: LaunchRow[] = [];
  const perUser = new Map<string, number>();
  const fold = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const rank = (item: (typeof raw.launches.items)[number]) => {
    const first = fold((item.name || "").split(" ")[0] || "");
    const personTitle = first.length > 2 && fold(item.title).startsWith(first);
    return item.upvoteCount * 10 + (personTitle ? 0 : 3) + (item.stack?.length ? 1 : 0);
  };
  const items = [...raw.launches.items].sort((a, b) => rank(b) - rank(a));
  for (const item of items) {
    if (!item.username || !item.title) continue;
    const n = perUser.get(item.username) || 0;
    if (n >= 1 && item.upvoteCount === 0) continue;
    if (n >= 2) continue;
    perUser.set(item.username, n + 1);
    out.push({
      title: item.title,
      username: item.username,
      name: item.name,
      upvoteCount: item.upvoteCount,
      stack: (item.stack || []).slice(0, 3),
    });
    if (out.length >= 4) break;
  }
  return out;
})();

function winnerAvatar(username: string): string | null {
  return avatarByUser.get(username.toLowerCase()) || null;
}

const hall = raw.weeklyWinners.filter((w) => w.username && w.name);
export const builderOfTheWeek: WinnerRow = {
  username: hall[0]?.username || "giannidona",
  name: hall[0]?.name || "Gianluca Donato",
  week: hall[0]?.week || null,
  tagline: hall[0]?.tagline || taglineByUser.get((hall[0]?.username || "").toLowerCase()) || null,
  avatarFile: winnerAvatar(hall[0]?.username || ""),
};

export const winnerTrail: WinnerRow[] = (() => {
  const seen = new Set<string>([builderOfTheWeek.username.toLowerCase()]);
  const out: WinnerRow[] = [];
  for (const w of hall) {
    const key = w.username.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      username: w.username,
      name: w.name,
      week: w.week,
      tagline: w.tagline,
      avatarFile: winnerAvatar(w.username),
    });
    if (out.length >= 3) break;
  }
  return out;
})();
