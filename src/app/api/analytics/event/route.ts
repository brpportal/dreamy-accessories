import { rateLimit, tooMany } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
const schema = z.object({
  eventName: z.enum(['page_view','product_view','category_view','search','add_to_cart','remove_from_cart','checkout_started','order_created','payment_submitted','wishlist_add','whatsapp_click']),
  sessionId: z.string().uuid(), pagePath: z.string().max(500).optional(), referrerHost: z.string().max(255).optional(),
  productId: z.string().uuid().optional(), categoryId: z.string().uuid().optional(), metadata: z.record(z.string(), z.unknown()).optional()
});
export async function POST(req: NextRequest) {
  if(!rateLimit(req,'analytics',120,60000)) return tooMany();
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid analytics event' }, { status: 400 });
    const s = await createSupabaseServerClient();
    const d = parsed.data;
    const m = (d.metadata || {}) as Record<string, unknown>; const str = (k: string) => (typeof m[k] === 'string' ? (m[k] as string) : null);
    const legacy = ['page_view','product_view','category_view','search','add_to_cart','remove_from_cart','checkout_started','order_created','payment_submitted'].includes(d.eventName);
    let ok = false;
    if (legacy) {
      const { error } = await s.rpc('track_store_event', { p_event_name: d.eventName, p_session_id: d.sessionId, p_page_path: d.pagePath || '/', p_referrer_host: d.referrerHost || null, p_product_id: d.productId || null, p_category_id: d.categoryId || null, p_metadata: d.metadata || {} });
      if (!error) ok = true;
    }
    // New insight table (migration 0003). If the migration is not applied yet this call fails silently.
    const { error: e2 } = await s.rpc('track_insight_event', { p_event_name: d.eventName, p_session_id: d.sessionId, p_page_path: d.pagePath || '/', p_referrer_host: d.referrerHost || null, p_utm_source: str('utm_source'), p_utm_medium: str('utm_medium'), p_product_id: d.productId || null, p_category_id: d.categoryId || null, p_search_query: str('query'), p_search_results: typeof m.results === 'number' ? Math.max(0, Math.min(100000, Math.floor(m.results))) : null, p_device: str('device') });
    if (!e2) ok = true;
    if (!ok) return NextResponse.json({ error: 'Analytics unavailable' }, { status: 503 });
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch { return NextResponse.json({ error: 'Analytics unavailable' }, { status: 503 }); }
}
