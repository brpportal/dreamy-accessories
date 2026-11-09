import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
const schema = z.object({
  eventName: z.enum(['page_view','product_view','category_view','search','add_to_cart','remove_from_cart','checkout_started','order_created','payment_submitted']),
  sessionId: z.string().uuid(), pagePath: z.string().max(500).optional(), referrerHost: z.string().max(255).optional(),
  productId: z.string().uuid().optional(), categoryId: z.string().uuid().optional(), metadata: z.record(z.string(), z.unknown()).optional()
});
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid analytics event' }, { status: 400 });
    const s = await createSupabaseServerClient();
    const d = parsed.data;
    const { error } = await s.rpc('track_store_event', {
      p_event_name: d.eventName, p_session_id: d.sessionId, p_page_path: d.pagePath || '/',
      p_referrer_host: d.referrerHost || null, p_product_id: d.productId || null,
      p_category_id: d.categoryId || null, p_metadata: d.metadata || {}
    });
    if (error) return NextResponse.json({ error: 'Analytics unavailable' }, { status: 503 });
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch { return NextResponse.json({ error: 'Analytics unavailable' }, { status: 503 }); }
}
