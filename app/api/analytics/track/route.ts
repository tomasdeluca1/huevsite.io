import { NextRequest, NextResponse } from 'next/server';
import { analyticsService, AnalyticsEvent } from '@/lib/analytics-service';

// Crawlers, previewers, uptime monitors and headless agents. These never see
// the page, but they used to cost two INSERTs each (analytics_events +
// profile_visitors) and showed up in builders' insights as fake visitors.
const BOT_UA =
  /bot|crawler|spider|crawling|slurp|headless|phantom|puppeteer|playwright|selenium|curl\/|wget|python-requests|axios|node-fetch|go-http-client|java\/|okhttp|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|preview|scraper|facebookexternalhit|whatsapp|telegram|slackbot|discordbot|embedly|quora link preview|vercelbot|ahrefs|semrush|mj12|dotbot|petalbot|dataforseo|gptbot|claudebot|anthropic|perplexity|ccbot|bytespider|amazonbot|applebot|google-extended/i;

function isBot(ua: string) {
  // An empty UA is not a real browser hitting this endpoint either.
  return !ua || BOT_UA.test(ua);
}

// Embedded profiles (?embed=1) are iframed by third-party sites that rotate
// through builders every few seconds. Each rotation remounts the page and used
// to write two rows. That single pattern produced 98.5% of the analytics rows
// written in the last 30 days and exhausted the project's Disk IO budget.
function isEmbeddedView(referrer: string) {
  if (!referrer) return false;
  try {
    return new URL(referrer).searchParams.get('embed') === '1';
  } catch {
    return referrer.includes('embed=1');
  }
}

function normalizeGeoHeader(value: string | null) {
  if (!value) return null;
  const normalized = value.trim();

  if (!normalized || normalized.toLowerCase() === 'unknown') {
    return null;
  }

  return normalized;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, event_type, sub_site_id, block_id, metadata } = body;

    const host = req.headers.get('host') || '';
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return NextResponse.json({ success: true, ignored: true });
    }

    if (!user_id || !event_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Visitor ID from IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    const visitor_id = forwardedFor ? forwardedFor.split(',')[0].trim() : 'anonymous';
    const user_agent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || '';

    // Drop the two write sources that generate traffic no human produced. The
    // profile page already skips the tracker in embed mode; this is the
    // server-side guarantee, and it also covers any other site that iframes us.
    if (isEmbeddedView(referrer) || isBot(user_agent)) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const country =
      normalizeGeoHeader(req.headers.get('x-vercel-ip-country')) ||
      normalizeGeoHeader(req.headers.get('cf-ipcountry'));
    const city =
      normalizeGeoHeader(req.headers.get('x-vercel-ip-city')) ||
      normalizeGeoHeader(req.headers.get('x-appengine-city'));

    const event: AnalyticsEvent = {
      user_id,
      event_type,
      sub_site_id,
      block_id,
      visitor_id,
      metadata: {
        ...metadata,
        user_agent,
        referrer,
      }
    };

    await analyticsService.trackEvent(event);

    // Also track as a profile visitor for page_view events
    if (event_type === 'page_view') {
      const visitorUserInfo = body.visitor_user_info || null;
      
      await analyticsService.trackProfileVisitor({
        profile_id: user_id,
        visitor_id,
        visitor_user_id: visitorUserInfo?.user_id || null,
        visitor_username: visitorUserInfo?.username || null,
        visitor_name: visitorUserInfo?.name || null,
        visitor_avatar: visitorUserInfo?.avatar || null,
        country,
        city,
        referrer,
        user_agent,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Track error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
