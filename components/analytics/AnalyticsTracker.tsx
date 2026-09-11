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

// One page_view per profile per tab per half hour. Without this, every remount
// (client-side nav back to a profile, a refresh, React's double-mount in dev)
// wrote a fresh analytics_events row *and* a fresh profile_visitors row, so a
// single person bouncing between profiles inflated both tables — and their own
// insights — for free. sessionStorage keeps it per-tab, which is the closest
// thing to a "visit" we can measure without another DB read.
const VISIT_TTL_MS = 30 * 60 * 1000;

function alreadyTrackedThisVisit(key: string) {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw && Date.now() - Number(raw) < VISIT_TTL_MS) return true;
    window.sessionStorage.setItem(key, String(Date.now()));
    return false;
  } catch {
    // Private mode / storage disabled: fall through and track as before.
    return false;
  }
}

export function AnalyticsTracker({ userId, subSiteId, blockId, eventType = 'page_view', visitorUserInfo }: Props) {
  useEffect(() => {
    // No trackear en localhost
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return;
    }

    // Embedded profiles are iframed by third-party sites that rotate through
    // builders on a timer. The server drops these too, but bailing here saves
    // the request entirely.
    if (typeof window !== 'undefined' && window.self !== window.top) {
      return;
    }

    if (eventType === 'page_view') {
      if (alreadyTrackedThisVisit(`hv_pv:${userId}:${subSiteId || 'main'}`)) return;

      const track = async () => {
        try {
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
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
