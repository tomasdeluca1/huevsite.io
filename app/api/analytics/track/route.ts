import { NextRequest, NextResponse } from 'next/server';
import { analyticsService, AnalyticsEvent } from '@/lib/analytics-service';

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
