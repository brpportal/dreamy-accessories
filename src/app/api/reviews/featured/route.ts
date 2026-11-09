import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
type Row = { id: string; customer_name: string; rating: number; review_title: string | null; review_text: string | null; products: { name: string } | { name: string }[] | null };
// Up to 8 most recent approved reviews rated 4+. The reviews table has no city column, so city is never returned.
export async function GET() {
  try {
    const s = await createSupabaseServerClient();
    const { data, error } = await s.from('product_reviews').select('id,customer_name,rating,review_title,review_text,products(name)').eq('moderation_status', 'approved').gte('rating', 4).order('created_at', { ascending: false }).limit(8);
    if (error) throw error;
    const reviews = ((data || []) as unknown as Row[]).map(r => {
      const parts = (r.customer_name || '').trim().split(/\s+/).filter(Boolean);
      const name = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : (parts[0] || 'Customer');
      const text = (r.review_text || '').trim();
      const prod = Array.isArray(r.products) ? r.products[0] : r.products;
      return { id: r.id, name, rating: r.rating, title: r.review_title, excerpt: text.length > 140 ? `${text.slice(0, 137).trimEnd()}…` : text, product: prod?.name || '' };
    });
    return NextResponse.json({ reviews });
  } catch { return NextResponse.json({ reviews: [] }); }
}
