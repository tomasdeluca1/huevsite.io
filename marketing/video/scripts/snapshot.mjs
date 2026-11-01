/**
 * Snapshot public huevsite.io data for the promo video.
 *
 * Sources (all public, no auth, no database):
 *   GET https://huevsite.io/api/explore
 *   GET https://huevsite.io/{username}
 *   GET https://huevsite.io/builders-de-la-semana
 *   GET https://huevsite.io/api/launches?week=YYYY-Wxx
 *
 * Writes marketing/video/data/snapshot.json and square avatars under public/avatars.
 */
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data");
const avatarDir = path.join(root, "public", "avatars");
const UA = "huevsite-marketing-snapshot/1.0 (+promo video; public pages only)";
const ORIGIN = "https://huevsite.io";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function getText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function decode(value) {
  return String(value || "")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchDirectory() {
  const profiles = [];
  let total = null;
  for (let page = 0; page < 20; page++) {
    // created_at pages through every public profile. sort=score can skip rows
    // when the ordering has ties, so the country census would come up short.
    const url = `${ORIGIN}/api/explore?page=${page}&limit=50&sort=created_at`;
    const data = await getJson(url);
    if (typeof data.count === "number") total = data.count;
    const batch = data.profiles || [];
    profiles.push(...batch);
    process.stdout.write(`explore page ${page}: +${batch.length} (running ${profiles.length}/${total ?? "?"})\n`);
    if (!data.hasMore || batch.length === 0) break;
    await sleep(150);
  }
  const byUser = new Map();
  for (const p of profiles) {
    if (p?.username) byUser.set(String(p.username).toLowerCase(), p);
  }
  return { total: total ?? byUser.size, profiles: [...byUser.values()] };
}

function countryName(code) {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(["es"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

function isGenericTagline(tagline) {
  const t = (tagline || "").trim();
  if (!t) return true;
  return /reci[eé]n llegado a huevsite|^builder\.?$|^yo\.?$|^dev\.?$|^d\s*e\s*v\.?$/i.test(t);
}

function pickBuilders(profiles) {
  const scored = profiles.map((p) => {
    let score = 0;
    if (p.image) score += 2;
    if (!isGenericTagline(p.tagline)) score += 4;
    if (p.is_winner) score += 8;
    if (p.country && p.country !== "AR") score += 6;
    if ((p.subsites_count || 0) > 0) score += 3;
    if ((p.github_commits_year || 0) > 30) score += 1;
    if ((p.followers_count || 0) > 2) score += 1;
    score += Math.min(4, (p.builder_score || 0) / 350);
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score || (b.p.builder_score || 0) - (a.p.builder_score || 0));

  const picked = [];
  const seen = new Set();
  const take = (p) => {
    const key = String(p.username).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    picked.push(p);
  };

  for (const { p } of scored) if (p.is_winner) take(p);

  const byCountry = new Map();
  for (const { p } of scored) {
    if (!p.country || p.country === "AR") continue;
    if (!byCountry.has(p.country)) byCountry.set(p.country, []);
    byCountry.get(p.country).push(p);
  }
  for (const list of byCountry.values()) {
    take(list[0]);
    if (list[1] && list[1].image) take(list[1]);
  }

  for (const { p } of scored) {
    if (picked.length >= 72) break;
    if (!p.image) continue;
    if (isGenericTagline(p.tagline) && (p.subsites_count || 0) === 0 && !p.is_winner) continue;
    take(p);
  }
  for (const { p } of scored) {
    if (picked.length >= 64) break;
    if (p.image) take(p);
  }
  return picked.slice(0, 72);
}

function extractJsonLd(html) {
  const blocks = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    try {
      blocks.push(JSON.parse(m[1]));
    } catch {
      /* ignore malformed */
    }
  }
  return blocks;
}

function personFromHtml(html) {
  for (const block of extractJsonLd(html)) {
    const list = Array.isArray(block) ? block : [block];
    for (const node of list) {
      if (node?.["@type"] === "ProfilePage" && node.mainEntity) return node.mainEntity;
    }
  }
  return null;
}

function extractProjects(html) {
  const projects = [];
  const parts = html.split("block-project");
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i].slice(0, 5000);
    const title = chunk.match(/class="project-name[^"]*">([^<]+)/);
    if (!title) continue;
    const desc = chunk.match(/class="project-desc[^"]*">([^<]+)/);
    const status = chunk.match(/uppercase tracking-widest"[^>]*>([^<]+)/);
    const stack = [...chunk.matchAll(/font-mono px-2 py-1[^>]*>([^<]+)/g)].map((x) => decode(x[1])).filter(Boolean);
    const href = chunk.match(/href="(https?:\/\/[^"]+)"/);
    projects.push({
      title: decode(title[1]),
      description: desc ? decode(desc[1]) : "",
      status: status ? decode(status[1]) : null,
      stack: [...new Set(stack)].slice(0, 6),
      link: href ? decode(href[1]).replace(/&utm_source=huevsite.*/, "") : null,
    });
    if (projects.length >= 4) break;
  }
  return projects;
}

function extractStackBlock(html) {
  const idx = html.indexOf("block-stack");
  if (idx < 0) return [];
  const chunk = html.slice(idx, idx + 4000);
  const items = [...chunk.matchAll(/font-mono font-bold[^>]*>([^<]+)/g)].map((m) => decode(m[1])).filter(Boolean);
  return [...new Set(items)].slice(0, 12);
}

async function enrich(profile) {
  const username = String(profile.username);
  const url = `${ORIGIN}/${encodeURIComponent(username)}`;
  let html = "";
  try {
    html = await getText(url);
  } catch (err) {
    return { error: String(err.message || err) };
  }
  const person = personFromHtml(html);
  const projects = extractProjects(html);
  const stackBlock = extractStackBlock(html);
  const knows = Array.isArray(person?.knowsAbout)
    ? person.knowsAbout.map((s) => decode(s)).filter(Boolean)
    : typeof person?.knowsAbout === "string"
      ? [decode(person.knowsAbout)]
      : [];
  const role = person?.jobTitle ? decode(person.jobTitle) : null;
  const location = person?.homeLocation?.name ? decode(person.homeLocation.name) : null;
  const stack = [...new Set([...stackBlock, ...knows, ...projects.flatMap((p) => p.stack)])]
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s && s.length < 32)
    .slice(0, 8);
  return {
    name: decode(person?.name || profile.name || username),
    role,
    location,
    stack,
    projects,
    profileUrl: url,
  };
}

async function mapPool(items, limit, worker) {
  const out = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: limit }, run));
  return out;
}

async function downloadAvatar(username, url) {
  if (!url) return null;
  const safe = username.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const raw = path.join(avatarDir, `${safe}.src`);
  const dest = path.join(avatarDir, `${safe}.jpg`);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 80 || buf.length > 8_000_000) return null;
    await writeFile(raw, buf);
    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      raw,
      "-vf",
      "scale=256:256:force_original_aspect_ratio=increase,crop=256:256",
      "-q:v",
      "4",
      dest,
    ], { timeout: 20000 });
    return `avatars/${safe}.jpg`;
  } catch {
    return null;
  }
}

async function fetchWinners() {
  const html = await getText(`${ORIGIN}/builders-de-la-semana`);
  const winners = [];
  for (const block of extractJsonLd(html)) {
    const list = Array.isArray(block) ? block : [block];
    for (const node of list) {
      const items = node?.mainEntity?.itemListElement;
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const name = decode(item.name || "");
        const match = name.match(/^(.*) — semana (\d{4}-W\d{2})$/);
        const username = decode(String(item.url || "").split("/").pop() || "");
        if (!username) continue;
        winners.push({
          username,
          name: match ? decode(match[1]) : name,
          week: match ? match[2] : null,
          tagline: item.description ? decode(item.description) : null,
          url: item.url,
        });
      }
    }
  }
  return winners;
}

async function fetchLaunches() {
  // Walk back from the current public week until a week actually has launches.
  const head = await getJson(`${ORIGIN}/api/launches`);
  const start = /^(\d{4})-W(\d{2})$/.exec(head.week || "") || ["", "2026", "44"];
  let year = Number(start[1]);
  let week = Number(start[2]);
  const emptyWeeks = [];
  for (let i = 0; i < 30; i++) {
    const id = `${year}-W${String(week).padStart(2, "0")}`;
    const data = await getJson(`${ORIGIN}/api/launches?week=${id}`);
    const launches = data.launches || [];
    if (launches.length) {
      return {
        week: data.week || id,
        currentWeek: head.week || null,
        weeksScannedEmptyBeforeHit: emptyWeeks,
        items: launches.map((l) => ({
          title: decode(l.title),
          description: decode(l.description || "").slice(0, 180),
          stack: Array.isArray(l.stack) ? l.stack.map(decode).filter(Boolean).slice(0, 6) : [],
          upvoteCount: Number(l.upvoteCount) || 0,
          featured: !!l.featured,
          link: l.link || null,
          username: l.user?.username || null,
          name: l.user?.name ? decode(l.user.name) : null,
        })),
      };
    }
    emptyWeeks.push(id);
    week -= 1;
    if (week < 1) {
      year -= 1;
      week = 52;
    }
    await sleep(80);
  }
  return { week: null, currentWeek: head.week || null, weeksScannedEmptyBeforeHit: emptyWeeks, items: [] };
}

function publicBuilder(profile, extra, avatarFile) {
  return {
    username: String(profile.username),
    name: extra?.name || decode(profile.name || profile.username),
    avatar: profile.image || null,
    avatarFile,
    tagline: profile.tagline ? decode(profile.tagline) : null,
    role: extra?.role || null,
    stack: extra?.stack || [],
    projects: extra?.projects || [],
    location: extra?.location || null,
    country: profile.country || null,
    countryName: countryName(profile.country),
    isWinner: !!profile.is_winner,
    profileUrl: extra?.profileUrl || `${ORIGIN}/${profile.username}`,
  };
}

async function main() {
  await mkdir(dataDir, { recursive: true });
  await mkdir(avatarDir, { recursive: true });

  const [{ total, profiles }, winners, launches] = await Promise.all([
    fetchDirectory(),
    fetchWinners(),
    fetchLaunches(),
  ]);

  const counts = new Map();
  let withoutCountry = 0;
  for (const p of profiles) {
    if (!p.country) {
      withoutCountry += 1;
      continue;
    }
    counts.set(p.country, (counts.get(p.country) || 0) + 1);
  }
  const byCountry = [...counts.entries()]
    .map(([code, count]) => ({ code, name: countryName(code), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"));

  const selected = pickBuilders(profiles);
  process.stdout.write(`enriching ${selected.length} public profiles\n`);

  const enriched = await mapPool(selected, 5, async (profile, i) => {
    const extra = await enrich(profile);
    if (i % 8 === 0) process.stdout.write(`  profile ${i + 1}/${selected.length} @${profile.username}\n`);
    await sleep(120);
    return { profile, extra };
  });

  process.stdout.write("downloading avatars\n");
  const builders = [];
  for (const { profile, extra } of enriched) {
    const avatarFile = await downloadAvatar(profile.username, profile.image);
    const { error, ...rest } = extra || {};
    builders.push({ ...publicBuilder(profile, error ? null : rest, avatarFile), fetchError: error || null });
  }

  const withProjects = builders.filter((b) => b.projects.length > 0).length;
  const withLocation = builders.filter((b) => b.location).length;
  const withStack = builders.filter((b) => b.stack.length > 0).length;

  const snapshot = {
    fetchedAt: new Date().toISOString(),
    sources: [
      `${ORIGIN}/api/explore?sort=score`,
      `${ORIGIN}/{username}`,
      `${ORIGIN}/builders-de-la-semana`,
      `${ORIGIN}/api/launches`,
    ],
    directory: {
      total,
      publicLabel: "+300 builders",
      fetchedProfiles: profiles.length,
      byCountry,
      withoutCountry,
    },
    sample: {
      builders: builders.length,
      withProjects,
      withLocation,
      withStack,
      withAvatarFile: builders.filter((b) => b.avatarFile).length,
    },
    builders,
    weeklyWinners: winners,
    launches,
  };

  const out = path.join(dataDir, "snapshot.json");
  await writeFile(out, JSON.stringify(snapshot, null, 2));
  process.stdout.write(
    `wrote ${out}\n directory ${total} · featured ${builders.length} · projects ${withProjects} · countries ${byCountry.length} · launches ${launches.items.length} (${launches.week}) · winners ${winners.length}\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
