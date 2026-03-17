import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Usamos el service role key para inserciones internas y bypass de RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export type AnalyticsEvent = {
  user_id: string;
  event_type: 'page_view' | 'block_click';
  sub_site_id?: string | null;
  block_id?: string | null;
  visitor_id?: string;
  metadata?: any;
};

// Simple user-agent parser helpers
function parseBrowser(ua: string): string {
  if (!ua) return 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('SamsungBrowser')) return 'Samsung Internet';
  if (ua.includes('Instagram')) return 'Instagram';
  if (ua.includes('FBAN') || ua.includes('FBAV')) return 'Facebook';
  if (ua.includes('Twitter')) return 'Twitter';
  if (ua.includes('LinkedIn')) return 'LinkedIn';
  return 'Other';
}

function parseOS(ua: string): string {
  if (!ua) return 'Unknown';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS') || ua.includes('Macintosh')) return 'Mac OS';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Linux')) return 'Linux';
  return 'Other';
}

function parseDevice(ua: string): string {
  if (!ua) return 'Unknown';
  if (ua.includes('Mobi') || ua.includes('Android') || ua.includes('iPhone')) return 'Mobile';
  if (ua.includes('iPad') || ua.includes('Tablet')) return 'Tablet';
  return 'Desktop';
}

function parseReferrer(ref: string): string {
  if (!ref) return 'Direct/None';
  try {
    const url = new URL(ref);
    const host = url.hostname.replace('www.', '');
    // Map known social/search to clean names
    if (host.includes('twitter') || host.includes('t.co') || host.includes('x.com')) return 'X';
    if (host.includes('google')) return 'Google';
    if (host.includes('facebook') || host.includes('fb.com')) return 'Facebook';
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('youtube')) return 'YouTube';
    if (host.includes('reddit')) return 'Reddit';
    if (host.includes('tiktok')) return 'TikTok';
    if (host.includes('github')) return 'GitHub';
    return host;
  } catch {
    return 'Direct/None';
  }
}

function getFallbackAvatarUrl() {
  return '/huevsite-avatar.png';
}

export const analyticsService = {
  async trackEvent(event: AnalyticsEvent) {
    const { error } = await supabaseAdmin
      .from('analytics_events')
      .insert([event]);
    
    if (error) {
      console.error('Error tracking analytics event:', error);
      throw error;
    }
  },

  async trackProfileVisitor(data: {
    profile_id: string;
    visitor_id: string;
    visitor_user_id?: string | null;
    visitor_username?: string | null;
    visitor_name?: string | null;
    visitor_avatar?: string | null;
    referrer?: string | null;
    user_agent?: string | null;
  }) {
    const ua = data.user_agent || '';
    const browser = parseBrowser(ua);
    const os = parseOS(ua);
    const device = parseDevice(ua);
    const referrer = parseReferrer(data.referrer || '');

    const { error } = await supabaseAdmin
      .from('profile_visitors')
      .insert([{
        profile_id: data.profile_id,
        visitor_id: data.visitor_id,
        visitor_user_id: data.visitor_user_id || null,
        visitor_username: data.visitor_username || null,
        visitor_name: data.visitor_name || null,
        visitor_avatar: data.visitor_avatar || null,
        referrer,
        user_agent: ua,
        browser,
        os,
        device,
      }]);

    if (error) {
      // Non-fatal: log but don't throw
      console.error('Error tracking profile visitor:', error);
    }
  },

  async getInsights(userId: string, filters: { rangeDays?: number; startDate?: string | null; endDate?: string | null } = {}) {
    const now = new Date();
    const rangeEnd = filters.endDate ? new Date(`${filters.endDate}T23:59:59.999Z`) : now;
    const rangeStart = filters.startDate ? new Date(`${filters.startDate}T00:00:00.000Z`) : new Date(rangeEnd);
    const derivedRangeDays = filters.rangeDays || 1;

    if (!filters.startDate) {
      rangeStart.setDate(rangeStart.getDate() - derivedRangeDays);
    }

    const rangeDays = Math.max(1, Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)));

    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    // Fetch everything in parallel
    const [
      { data: pageViewEvents, error: pvError },
      { count: totalPageViews },
      { count: totalClicks },
      { data: blockClicks },
      { data: visitors },
      { count: totalRecentVisitors },
      { count: onlineNow }
    ] = await Promise.all([
      supabaseAdmin
        .from('analytics_events')
        .select('visitor_id, created_at, metadata')
        .eq('user_id', userId)
        .eq('event_type', 'page_view')
        .not('visitor_id', 'in', '("127.0.0.1","::1","localhost")')
        .gte('created_at', rangeStart.toISOString())
        .lte('created_at', rangeEnd.toISOString()),
      supabaseAdmin
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('visitor_id', 'in', '("127.0.0.1","::1","localhost")')
        .eq('event_type', 'page_view')
        .gte('created_at', rangeStart.toISOString())
        .lte('created_at', rangeEnd.toISOString()),
      supabaseAdmin
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('visitor_id', 'in', '("127.0.0.1","::1","localhost")')
        .eq('event_type', 'block_click')
        .gte('created_at', rangeStart.toISOString())
        .lte('created_at', rangeEnd.toISOString()),
      supabaseAdmin
        .from('analytics_events')
        .select('visitor_id, block_id')
        .eq('user_id', userId)
        .eq('event_type', 'block_click')
        .not('visitor_id', 'in', '("127.0.0.1","::1","localhost")')
        .gte('created_at', rangeStart.toISOString())
        .lte('created_at', rangeEnd.toISOString())
        .not('block_id', 'is', null),
      supabaseAdmin
        .from('profile_visitors')
        .select('id, profile_id, visitor_id, visitor_user_id, visitor_username, visitor_name, visitor_avatar, country, city, referrer, user_agent, browser, os, device, created_at')
        .eq('profile_id', userId)
        .not('visitor_id', 'in', '("127.0.0.1","::1","localhost")')
        .gte('created_at', rangeStart.toISOString())
        .lte('created_at', rangeEnd.toISOString())
        .order('created_at', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('profile_visitors')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId)
        .not('visitor_id', 'in', '("127.0.0.1","::1","localhost")')
        .gte('created_at', rangeStart.toISOString())
        .lte('created_at', rangeEnd.toISOString()),
      supabaseAdmin
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', 'page_view')
        .not('visitor_id', 'in', '("127.0.0.1","::1","localhost")')
        .gte('created_at', fiveMinutesAgo.toISOString())
    ]);

    if (pvError) throw pvError;

    const isHourlyRange = !filters.startDate && !filters.endDate && derivedRangeDays === 1;

    // Unique visitors (filtered range)
    const uniqueVisitors = new Set(pageViewEvents?.map(v => v.visitor_id)).size;

    const visitorsMap: Record<string, Set<string>> = {};
    const chartMap: Record<string, number> = {};

    if (isHourlyRange) {
      const hourStart = new Date(rangeStart);
      hourStart.setMinutes(0, 0, 0);
      for (let i = 0; i < 24; i++) {
        const d = new Date(hourStart);
        d.setHours(hourStart.getHours() + i);
        const key = d.toISOString();
        chartMap[key] = 0;
      }

      pageViewEvents?.forEach((ev) => {
        const eventDate = new Date(ev.created_at);
        eventDate.setMinutes(0, 0, 0);
        const key = eventDate.toISOString();
        if (chartMap[key] !== undefined) {
          if (!visitorsMap[key]) visitorsMap[key] = new Set();
          visitorsMap[key].add(ev.visitor_id);
        }
      });
    } else {
      for (let i = 0; i <= rangeDays; i++) {
        const d = new Date(rangeStart);
        d.setDate(d.getDate() + i);
        if (d > rangeEnd) break;
        const key = d.toISOString().split('T')[0];
        chartMap[key] = 0;
      }

      pageViewEvents?.forEach((ev) => {
        const day = ev.created_at.split('T')[0];
        if (chartMap[day] !== undefined) {
          if (!visitorsMap[day]) visitorsMap[day] = new Set();
          visitorsMap[day].add(ev.visitor_id);
        }
      });
    }

    Object.keys(visitorsMap).forEach((bucket) => {
      chartMap[bucket] = visitorsMap[bucket].size;
    });

    const dailyVisitors = Object.entries(chartMap).map(([date, count]) => ({ date, count }));

    // Referrer breakdown
    const referrerMap: Record<string, number> = {};
    pageViewEvents?.forEach(ev => {
      const ref = parseReferrer(ev.metadata?.referrer || '');
      referrerMap[ref] = (referrerMap[ref] || 0) + 1;
    });
    const referrers = Object.entries(referrerMap)
      .map(([source, visitors]) => ({ source, visitors }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);

    // Browser breakdown
    const browserMap: Record<string, number> = {};
    pageViewEvents?.forEach(ev => {
      const browser = parseBrowser(ev.metadata?.user_agent || '');
      browserMap[browser] = (browserMap[browser] || 0) + 1;
    });
    const browsers = Object.entries(browserMap)
      .map(([browser, visitors]) => ({ browser, visitors }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 8);

    // OS breakdown
    const osMap: Record<string, number> = {};
    pageViewEvents?.forEach(ev => {
      const os = parseOS(ev.metadata?.user_agent || '');
      osMap[os] = (osMap[os] || 0) + 1;
    });
    const operatingSystems = Object.entries(osMap)
      .map(([os, visitors]) => ({ os, visitors }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 8);

    // Device breakdown
    const deviceMap: Record<string, number> = {};
    pageViewEvents?.forEach(ev => {
      const device = parseDevice(ev.metadata?.user_agent || '');
      deviceMap[device] = (deviceMap[device] || 0) + 1;
    });
    const devices = Object.entries(deviceMap)
      .map(([device, visitors]) => ({ device, visitors }))
      .sort((a, b) => b.visitors - a.visitors);

    const blockStats: Record<string, number> = {};
    const visitorClickCounts: Record<string, number> = {};
    const visitorBlockClicks: Record<string, Record<string, number>> = {};
    blockClicks?.forEach(bc => {
      blockStats[bc.block_id!] = (blockStats[bc.block_id!] || 0) + 1;
      if (bc.visitor_id) {
        visitorClickCounts[bc.visitor_id] = (visitorClickCounts[bc.visitor_id] || 0) + 1;
        if (bc.block_id) {
          if (!visitorBlockClicks[bc.visitor_id]) visitorBlockClicks[bc.visitor_id] = {};
          visitorBlockClicks[bc.visitor_id][bc.block_id] = (visitorBlockClicks[bc.visitor_id][bc.block_id] || 0) + 1;
        }
      }
    });

    // CTR
    const ctr = totalPageViews && totalPageViews > 0
      ? ((totalClicks || 0) / totalPageViews) * 100
      : 0;

    // Bounce rate (visitors with only 1 page view ~rough estimate)
    const visitorViewCounts: Record<string, number> = {};
    pageViewEvents?.forEach(ev => {
      visitorViewCounts[ev.visitor_id] = (visitorViewCounts[ev.visitor_id] || 0) + 1;
    });
    const bounced = Object.values(visitorViewCounts).filter(v => v === 1).length;
    const bounceRate = uniqueVisitors > 0 ? (bounced / uniqueVisitors) * 100 : 0;

    const visitorPageViews: Record<string, number> = {};
    pageViewEvents?.forEach(ev => {
      visitorPageViews[ev.visitor_id] = (visitorPageViews[ev.visitor_id] || 0) + 1;
    });

    const visitorOccurrences: Record<string, number> = {};
    (visitors || []).forEach((visitor) => {
      visitorOccurrences[visitor.visitor_id] = (visitorOccurrences[visitor.visitor_id] || 0) + 1;
    });

    const visitorUserIds = Array.from(new Set((visitors || []).map((visitor) => visitor.visitor_user_id).filter(Boolean)));
    const visitorUsernames = Array.from(new Set((visitors || []).map((visitor) => visitor.visitor_username).filter(Boolean)));
    let visitorProfilesById: Record<string, { image: string | null; username: string | null; name: string | null }> = {};
    let visitorProfilesByUsername: Record<string, { id: string; image: string | null; username: string | null; name: string | null }> = {};
    let heroAvatarByUserId: Record<string, string | null> = {};

    if (visitorUserIds.length > 0) {
      const { data: visitorProfiles } = await supabaseAdmin
        .from('profiles')
        .select('id, username, name, image')
        .in('id', visitorUserIds);

      visitorProfilesById = Object.fromEntries(
        (visitorProfiles || []).map((profile) => [
          profile.id,
          {
            image: profile.image || null,
            username: profile.username || null,
            name: profile.name || null,
          }
        ])
      );
    }

    if (visitorUsernames.length > 0) {
      const { data: visitorProfilesByName } = await supabaseAdmin
        .from('profiles')
        .select('id, username, name, image')
        .in('username', visitorUsernames);

      visitorProfilesByUsername = Object.fromEntries(
        (visitorProfilesByName || []).map((profile) => [
          profile.username,
          {
            id: profile.id,
            image: profile.image || null,
            username: profile.username || null,
            name: profile.name || null,
          }
        ])
      );
    }

    const heroLookupUserIds = Array.from(new Set([
      ...visitorUserIds,
      ...Object.values(visitorProfilesByUsername).map((profile) => profile.id).filter(Boolean),
    ]));

    if (heroLookupUserIds.length > 0) {
      const { data: heroBlocks } = await supabaseAdmin
        .from('blocks')
        .select('user_id, data')
        .in('user_id', heroLookupUserIds)
        .is('sub_site_id', null)
        .eq('type', 'hero');

      heroAvatarByUserId = Object.fromEntries(
        (heroBlocks || []).map((block) => [block.user_id, block.data?.avatarUrl || null])
      );
    }

    const recentVisitors = (visitors || []).map((visitor) => ({
      ...visitor,
      visitor_username: visitorProfilesById[visitor.visitor_user_id || '']?.username || visitorProfilesByUsername[visitor.visitor_username || '']?.username || visitor.visitor_username || null,
      visitor_name: visitorProfilesById[visitor.visitor_user_id || '']?.name || visitorProfilesByUsername[visitor.visitor_username || '']?.name || visitor.visitor_name || null,
      visitor_avatar:
        visitorProfilesById[visitor.visitor_user_id || '']?.image ||
        heroAvatarByUserId[visitor.visitor_user_id || ''] ||
        visitorProfilesByUsername[visitor.visitor_username || '']?.image ||
        heroAvatarByUserId[visitorProfilesByUsername[visitor.visitor_username || '']?.id || ''] ||
        visitor.visitor_avatar ||
        getFallbackAvatarUrl(),
      page_views: visitorPageViews[visitor.visitor_id] || 0,
      block_clicks: visitorClickCounts[visitor.visitor_id] || 0,
      visits: visitorOccurrences[visitor.visitor_id] || 1,
      clicked_blocks: Object.entries(visitorBlockClicks[visitor.visitor_id] || {}).map(([blockId, clicks]) => ({
        block_id: blockId,
        clicks,
      })),
    }));


    return {
      uniqueVisitors,
      totalClicks: totalClicks || 0,
      totalPageViews: totalPageViews || 0,
      ctr: parseFloat(ctr.toFixed(2)),
      bounceRate: parseFloat(bounceRate.toFixed(1)),
      blockStats,
      dailyVisitors,
      referrers,
      browsers,
      operatingSystems,
      devices,
      recentVisitors,
      totalRecentVisitors: totalRecentVisitors || 0,
      rangeDays,
      startDate: rangeStart.toISOString().split('T')[0],
      endDate: rangeEnd.toISOString().split('T')[0],
      granularity: isHourlyRange ? 'hour' : 'day',
      onlineNow: onlineNow || 0,
    };
  }
};
