'use client';
import { useEffect } from 'react';
export function trackEvent(eventName: string, extra: Record<string, unknown> = {}) {
  try {
    let session = localStorage.getItem('da-analytics-session');
    if (!session) { session = crypto.randomUUID(); localStorage.setItem('da-analytics-session', session); }
    const referrerHost = document.referrer ? new URL(document.referrer).hostname : undefined;
    void fetch('/api/analytics/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ eventName, sessionId: session, pagePath: location.pathname, referrerHost, ...extra }) });
  } catch { /* analytics must never block shopping */ }
}
export default function AnalyticsTracker() {
  useEffect(() => { trackEvent('page_view'); }, []);
  return null;
}
