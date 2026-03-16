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

  async getInsights(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    // Fetch everything in parallel
    const [
      { data: pageViewEvents, error: pvError },
      { count: totalPageViewsAllTime },
      { count: totalClicks },
      { data: blockClicks },
      { data: visitors },
      { count: onlineNow }
    ] = await Promise.all([
      supabaseAdmin
        .from('analytics_events')
        .select('visitor_id, created_at, metadata')
        .eq('user_id', userId)
        .eq('event_type', 'page_view')
        .not('visitor_id', 'in', '("127.0.0.1","::1","localhost")')
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabaseAdmin
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('visitor_id', 'in', '("127.0.0.1","::1","localhost")')
        .eq('event_type', 'page_view'),
      supabaseAdmin
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('visitor_id', 'in', '("127.0.0.1","::1","localhost")')
        .eq('event_type', 'block_click'),
      supabaseAdmin
        .from('analytics_events')
        .select('block_id')
        .eq('user_id', userId)
        .eq('event_type', 'block_click')
        .not('visitor_id', 'in', '("127.0.0.1","::1","localhost")')
        .not('block_id', 'is', null),
      supabaseAdmin
        .from('profile_visitors')
        .select('id, profile_id, visitor_id, visitor_user_id, visitor_username, visitor_name, visitor_avatar, country, city, referrer, user_agent, browser, os, device, created_at')
        .eq('profile_id', userId)
        .not('visitor_id', 'in', '("127.0.0.1","::1","localhost")')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20),
      supabaseAdmin
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', 'page_view')
        .not('visitor_id', 'in', '("127.0.0.1","::1","localhost")')
        .gte('created_at', fiveMinutesAgo.toISOString())
    ]);

    if (pvError) throw pvError;

    // Unique visitors (30 days)
    const uniqueVisitors = new Set(pageViewEvents?.map(v => v.visitor_id)).size;

    // Daily visitors chart (last 30 days)
    const dailyMap: Record<string, number> = {};
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }

    const dailyVisitorsMap: Record<string, Set<string>> = {};
    pageViewEvents?.forEach(ev => {
      const day = ev.created_at.split('T')[0];
      if (dailyMap[day] !== undefined) {
        if (!dailyVisitorsMap[day]) dailyVisitorsMap[day] = new Set();
        dailyVisitorsMap[day].add(ev.visitor_id);
      }
    });
    Object.keys(dailyVisitorsMap).forEach(day => {
      dailyMap[day] = dailyVisitorsMap[day].size;
    });

    const dailyVisitors = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

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
    blockClicks?.forEach(bc => {
      blockStats[bc.block_id!] = (blockStats[bc.block_id!] || 0) + 1;
    });

    // CTR
    const ctr = totalPageViewsAllTime && totalPageViewsAllTime > 0
      ? ((totalClicks || 0) / totalPageViewsAllTime) * 100
      : 0;

    // Bounce rate (visitors with only 1 page view ~rough estimate)
    const visitorViewCounts: Record<string, number> = {};
    pageViewEvents?.forEach(ev => {
      visitorViewCounts[ev.visitor_id] = (visitorViewCounts[ev.visitor_id] || 0) + 1;
    });
    const bounced = Object.values(visitorViewCounts).filter(v => v === 1).length;
    const bounceRate = uniqueVisitors > 0 ? (bounced / uniqueVisitors) * 100 : 0;

    const recentVisitors = visitors || [];


    return {
      uniqueVisitors,
      totalClicks: totalClicks || 0,
      totalPageViews: totalPageViewsAllTime || 0,
      ctr: parseFloat(ctr.toFixed(2)),
      bounceRate: parseFloat(bounceRate.toFixed(1)),
      blockStats,
      dailyVisitors,
      referrers,
      browsers,
      operatingSystems,
      devices,
      recentVisitors,
      onlineNow: onlineNow || 0,
    };
  }
};
