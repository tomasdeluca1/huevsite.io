// PostgREST builds `.or(...)` from a string where "," separates conditions and
// "()" group them. Interpolating raw user input into that string lets a caller
// inject extra predicates (e.g. `a,id.gt.0` widens the match set). It can't
// change the selected columns, but it shouldn't be able to alter the query
// logic either. Strip the structural characters (and quotes/backslashes) so the
// value can only ever be used as an ilike pattern, never parsed as syntax.
export function sanitizeOrFilterValue(value: string): string {
  return value.replace(/[,()"\\*]/g, " ").replace(/\s+/g, " ").trim();
}
