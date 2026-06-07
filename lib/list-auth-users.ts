// Supabase's auth.admin.listUsers() returns only the FIRST page (default 50
// users) when called with no args. Email/cron jobs that iterate it un-paginated
// silently reach at most 50 users. This helper pages through all of them.
//
// perPage defaults to 50 to match Supabase's own default, so `startPage = 2`
// skips exactly the first un-paginated page (used for a one-time catch-up send).
export async function listAllAuthUsers(
  supabase: any,
  startPage = 1,
  perPage = 50
): Promise<any[]> {
  const users: any[] = [];
  for (let page = startPage; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data?.users || [];
    users.push(...batch);
    if (batch.length < perPage) break;
  }
  return users;
}
