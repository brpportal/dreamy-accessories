import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthorizedAdmin } from '@/lib/auth/api-admin';
import { slugify } from '@/lib/slug';
const body = z.object({ name: z.string().trim().min(2).max(60), slug: z.string().trim().max(80).optional(), description: z.string().trim().max(300).nullable().optional(), image_url: z.string().trim().url().max(500).or(z.literal('')).nullable().optional(), is_active: z.boolean().optional(), display_order: z.number().int().min(0).max(9999).optional() });
async function admin() { const { supabase, user } = await getAuthorizedAdmin(); return user ? supabase : null; }
const fields = 'id,name,slug,description,image_url,is_active,display_order,products(count)';
export async function GET() { const s = await admin(); if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await s.from('categories').select(fields).order('display_order').order('name'); if (error) return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.json({ categories: data ?? [] }); }
export async function POST(req: Request) { const s = await admin(); if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const p = body.safeParse(await req.json().catch(() => null)); if (!p.success) return NextResponse.json({ error: 'Enter a category name (2–60 characters).' }, { status: 400 });
  const d = p.data; const slug = slugify(d.slug || d.name); if (!slug) return NextResponse.json({ error: 'Invalid category name.' }, { status: 400 });
  const { data, error } = await s.from('categories').insert({ name: d.name, slug, description: d.description || null, image_url: d.image_url || null, is_active: d.is_active !== false, display_order: d.display_order ?? 0 }).select('id').single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'A category with this name already exists.' : error.message }, { status: 400 }); return NextResponse.json({ id: data.id }); }
export async function PATCH(req: Request) { const s = await admin(); if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const raw = await req.json().catch(() => null); const id = z.string().uuid().safeParse(raw?.id); const p = body.partial().safeParse(raw);
  if (!id.success || !p.success) return NextResponse.json({ error: 'Invalid category data.' }, { status: 400 });
  const d = p.data; const u: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (d.name !== undefined) u.name = d.name; if (d.slug !== undefined) u.slug = slugify(d.slug); if (d.description !== undefined) u.description = d.description || null;
  if (d.image_url !== undefined) u.image_url = d.image_url || null; if (d.is_active !== undefined) u.is_active = d.is_active; if (d.display_order !== undefined) u.display_order = d.display_order;
  const { error } = await s.from('categories').update(u).eq('id', id.data); if (error) return NextResponse.json({ error: error.code === '23505' ? 'That slug is already used.' : error.message }, { status: 400 }); return NextResponse.json({ ok: true }); }
export async function DELETE(req: Request) { const s = await admin(); if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = z.string().uuid().safeParse(new URL(req.url).searchParams.get('id')); if (!id.success) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
  // Products keep existing; their category simply becomes empty (FK is ON DELETE SET NULL).
  const { error } = await s.from('categories').delete().eq('id', id.data); if (error) return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.json({ ok: true }); }
