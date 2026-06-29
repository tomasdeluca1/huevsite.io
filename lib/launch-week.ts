// Single source of truth for ISO week math used by the launch feed.
// A launch_week is the string 'YYYY-Wxx' (ISO-8601 week-numbering year + week).

export interface ParsedWeek {
  year: number;
  week: number;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** ISO week-numbering year + week for a given date (UTC-based, Mon-start). */
function isoWeekOf(date: Date): ParsedWeek {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // Thursday of this week
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
  return { year: d.getUTCFullYear(), week };
}

function format(w: ParsedWeek): string {
  return `${w.year}-W${pad2(w.week)}`;
}

/** Monday (UTC) of the given ISO week. */
function isoWeekToMonday(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Dow);
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return monday;
}

export function currentLaunchWeek(): string {
  return format(isoWeekOf(new Date()));
}

export function parseWeek(week: string): ParsedWeek | null {
  const m = /^(\d{4})-W(\d{2})$/.exec(week || "");
  if (!m) return null;
  const year = Number(m[1]);
  const wk = Number(m[2]);
  if (wk < 1 || wk > 53) return null;
  return { year, week: wk };
}

/** Shift a week string by `delta` weeks (can be negative). Returns 'YYYY-Wxx'. */
export function addWeeks(week: string, delta: number): string {
  const p = parseWeek(week);
  if (!p) return week;
  const monday = isoWeekToMonday(p.year, p.week);
  monday.setUTCDate(monday.getUTCDate() + delta * 7);
  return format(isoWeekOf(monday));
}

/** Compare two week strings chronologically. -1 / 0 / 1. */
export function compareWeeks(a: string, b: string): number {
  const pa = parseWeek(a);
  const pb = parseWeek(b);
  if (!pa || !pb) return 0;
  if (pa.year !== pb.year) return pa.year < pb.year ? -1 : 1;
  if (pa.week !== pb.week) return pa.week < pb.week ? -1 : 1;
  return 0;
}

/** Whole days remaining until the current ISO week closes (Sunday 23:59 UTC). */
export function daysUntilWeekClose(): number {
  const p = parseWeek(currentLaunchWeek());
  if (!p) return 0;
  const sunday = isoWeekToMonday(p.year, p.week);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  const ms = sunday.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** Human label for a week, e.g. "30 jun – 6 jul". */
export function weekLabel(week: string, locale = "es"): string {
  const p = parseWeek(week);
  if (!p) return week;
  const monday = isoWeekToMonday(p.year, p.week);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}
