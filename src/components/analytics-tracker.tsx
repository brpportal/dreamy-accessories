'use client';
import { useEffect } from 'react';
export function trackEvent(eventName: string, extra: Record<string, unknown> = {}) {
  try {
    let session = localStorage.getItem('da-analytics-session');
    if (!session) { session = crypto.randomUUID(); localStorage.setItem('da-analytics-session', session); }
    const referrerHost = document.referrer ? new URL(document.referrer).hostname : undefined;
    const qs = new URLSearchParams(location.search);
    const meta: Record<string, unknown> = { device: window.innerWidth < 768 ? 'mobile' : 'desktop', ...((extra.metadata as Record<string, unknown>) || {}) };
    const src = qs.get('utm_source'); const med = qs.get('utm_medium');
    if (src) { meta.utm_source = src.slice(0, 60); try { sessionStorage.setItem('da-utm', JSON.stringify({ s: src.slice(0, 60), m: (med || '').slice(0, 60) })); } catch {} }
    else { try { const u = JSON.parse(sessionStorage.getItem('da-utm') || 'null'); if (u) { meta.utm_source = u.s; meta.utm_medium = u.m; } } catch {} }
    if (med) meta.utm_medium = med.slice(0, 60);
    const { metadata: _ignored, ...rest } = extra; void _ignored;
    void fetch('/api/analytics/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ eventName, sessionId: session, pagePath: location.pathname, referrerHost, ...rest, metadata: meta }) });
  } catch { /* analytics must never block shopping */ }
}
export default function AnalyticsTracker() {
  useEffect(() => { trackEvent('page_view'); }, []);
  return null;
}
