import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthorizedAdmin } from '@/lib/auth/api-admin';
import { slugify } from '@/lib/slug';
const num = z.coerce.number().finite();
const body = z.object({
  name: z.string().trim().min(2).max(120), slug: z.string().trim().max(120).optional(), description: z.string().max(4000).nullable().optional(), sku: z.string().trim().max(60).nullable().optional(),
  price: num.min(0).max(10000000), sale_price: num.min(0).max(10000000).nullable().optional(), stock_quantity: num.int().min(0).max(1000000).optional(),
  category_id: z.string().uuid().nullable().optional(), is_active: z.boolean().optional(), is_featured: z.boolean().optional()
}).superRefine((d, ctx) => { if (d.sale_price != null && d.sale_price >= d.price) ctx.addIssue({ code: 'custom', message: 'Sale price must be lower than the regular price.', path: ['sale_price'] }); });
async function admin() { const { supabase, user } = await getAuthorizedAdmin(); return user ? supabase : null; }
const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const bad = (p: { error: z.ZodError }) => NextResponse.json({ error: p.error.issues[0]?.message || 'Please check the product details.' }, { status: 400 });
const dbErr = (e: { code?: string; message: string }) => NextResponse.json({ error: e.code === '23505' ? 'This slug or SKU is already used by another product.' : e.message }, { status: 400 });
export async function GET() { const s = await admin(); if (!s) return unauthorized();
  const { data, error } = await s.from('products').select('id,name,slug,description,sku,price,sale_price,stock_quantity,is_active,is_featured,category_id,categories(name),product_images(id,image_url,source_type,storage_path,alt_text,display_order)').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.json({ products: data ?? [] }); }
export async function POST(req: Request) { const s = await admin(); if (!s) return unauthorized();
  const p = body.safeParse(await req.json().catch(() => null)); if (!p.success) return bad(p); const d = p.data; const slug = slugify(d.slug || d.name); if (!slug) return NextResponse.json({ error: 'Invalid product name.' }, { status: 400 });
  const { data, error } = await s.from('products').insert({ name: d.name, slug, description: d.description || null, sku: d.sku || null, price: d.price, sale_price: d.sale_price ?? null, stock_quantity: d.stock_quantity ?? 0, category_id: d.category_id ?? null, is_active: d.is_active !== false, is_featured: d.is_featured === true }).select('id').single();
  if (error) return dbErr(error); return NextResponse.json({ id: data.id }); }
export async function PATCH(req: Request) { const s = await admin(); if (!s) return unauthorized();
  const raw = await req.json().catch(() => null); const id = z.string().uuid().safeParse(raw?.id); const p = body.safeParse(raw); if (!id.success) return NextResponse.json({ error: 'Invalid product.' }, { status: 400 }); if (!p.success) return bad(p); const d = p.data;
  const slug = slugify(d.slug || d.name); if (!slug) return NextResponse.json({ error: 'Invalid slug.' }, { status: 400 });
  const { error } = await s.from('products').update({ name: d.name, slug, description: d.description || null, sku: d.sku || null, price: d.price, sale_price: d.sale_price ?? null, stock_quantity: d.stock_quantity ?? 0, category_id: d.category_id ?? null, is_active: d.is_active !== false, is_featured: d.is_featured === true, updated_at: new Date().toISOString() }).eq('id', id.data);
  if (error) return dbErr(error); return NextResponse.json({ ok: true }); }
// Quick toggles (active / featured / stock) without resending the whole form.
export async function PUT(req: Request) { const s = await admin(); if (!s) return unauthorized();
  const q = z.object({ id: z.string().uuid(), is_active: z.boolean().optional(), is_featured: z.boolean().optional(), stock_quantity: z.number().int().min(0).max(1000000).optional() }).safeParse(await req.json().catch(() => null)); if (!q.success) return bad(q);
  const { id, ...u } = q.data; if (!Object.keys(u).length) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  const { error } = await s.from('products').update({ ...u, updated_at: new Date().toISOString() }).eq('id', id); if (error) return dbErr(error); return NextResponse.json({ ok: true }); }
export async function DELETE(req: Request) { const s = await admin(); if (!s) return unauthorized();
  const raw = await req.json().catch(() => null); const id = z.string().uuid().safeParse(raw?.id); if (!id.success) return NextResponse.json({ error: 'Invalid product.' }, { status: 400 });
  await s.from('product_images').delete().eq('product_id', id.data);
  const { error } = await s.from('products').delete().eq('id', id.data);
  if (error) { // Product is referenced by orders/reviews: hide it instead, so order history stays intact.
    const { error: softErr } = await s.from('products').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id.data);
    if (softErr) return dbErr(softErr);
    return NextResponse.json({ ok: true, archived: true, message: 'This product has orders or reviews attached, so it was hidden from the store instead of being deleted.' });
  }
  return NextResponse.json({ ok: true }); }
