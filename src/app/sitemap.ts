import type { MetadataRoute } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dreamy-accessories.vercel.app').replace(/\/$/, '');
  const entries: MetadataRoute.Sitemap = [{ url: `${base}/`, changeFrequency: 'daily', priority: 1 }, { url: `${base}/track-order`, changeFrequency: 'monthly', priority: 0.3 }];
  try {
    const s = await createSupabaseServerClient();
    const { data } = await s.from('products').select('slug,updated_at').eq('is_active', true).limit(1000);
    (data || []).forEach((p: { slug: string; updated_at?: string }) => entries.push({ url: `${base}/products/${p.slug}`, lastModified: p.updated_at ? new Date(p.updated_at) : undefined, changeFrequency: 'weekly', priority: 0.8 }));
  } catch { /* sitemap still lists static pages if the database is unreachable */ }
  return entries;
}
