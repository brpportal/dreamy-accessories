import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
const schema = z.object({ productId: z.string().uuid(), orderNumber: z.string().trim().min(4).max(40), phone: z.string().trim().min(10).max(25), rating: z.number().int().min(1).max(5), title: z.string().trim().max(100).optional(), text: z.string().trim().min(5).max(1500) });
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Please enter a valid order number, phone, rating and review.' }, { status: 400 });
  const d = parsed.data; const s = await createSupabaseServerClient();
  const { data, error } = await s.rpc('submit_product_review', { p_product_id: d.productId, p_order_number: d.orderNumber, p_customer_phone: d.phone, p_rating: d.rating, p_review_title: d.title || null, p_review_text: d.text });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, result: data }, { status: 201 });
}
