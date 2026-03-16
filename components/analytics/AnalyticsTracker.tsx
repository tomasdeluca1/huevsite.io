"use client";

import { useEffect } from "react";

interface VisitorUserInfo {
  user_id?: string | null;
  username?: string | null;
  name?: string | null;
  avatar?: string | null;
}

interface Props {
  userId: string;
  subSiteId?: string;
  blockId?: string;
  eventType?: 'page_view' | 'block_click';
  visitorUserInfo?: VisitorUserInfo | null;
}

export function AnalyticsTracker({ userId, subSiteId, blockId, eventType = 'page_view', visitorUserInfo }: Props) {
  useEffect(() => {
    // No trackear en localhost
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return;
    }

    if (eventType === 'page_view') {
      const track = async () => {
        try {
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              event_type: 'page_view',
              sub_site_id: subSiteId,
              visitor_user_info: visitorUserInfo || null,
            }),
          });
        } catch (e) {
          console.error('Analytics error:', e);
        }
      };

      track();
    }
  }, [userId, subSiteId, eventType]);

  return null;
}

// Helper para trackear clicks manuales
export async function trackClick(userId: string, blockId: string, subSiteId?: string) {
  // No trackear en localhost
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return;
  }

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        event_type: 'block_click',
        sub_site_id: subSiteId,
        block_id: blockId,
      }),
    });
  } catch (e) {
    console.error('Analytics click error:', e);
  }
}
