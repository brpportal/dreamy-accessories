import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import ProductDetail from '@/components/product-detail';
import type { Product } from '@/components/product-card';
import { effectivePrice } from '@/lib/format';

export const dynamic = 'force-dynamic';
type Img = { image_url: string; alt_text: string | null; display_order: number };
async function load(slug: string) {
  const s = await createSupabaseServerClient();
  const { data: p, error } = await s.from('products').select('id,name,slug,description,price,sale_price,stock_quantity,is_featured,category_id,categories(name),product_images(image_url,alt_text,display_order)').eq('slug', slug).eq('is_active', true).maybeSingle();
  if (error || !p) return null;
  return { s, p };
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const r = await load(slug).catch(() => null);
  if (!r) return { title: 'Product | Sparklesbyfarry' };
  const { p } = r; const img = [...((p.product_images || []) as Img[])].sort((a, b) => a.display_order - b.display_order)[0]?.image_url;
  const price = `Rs. ${effectivePrice(p).toLocaleString('en-PK')}`;
  const desc = `${price} · ${(p.description || 'A lovely addition to your everyday style.').slice(0, 140)}`;
  return { title: `${p.name} | Sparklesbyfarry`, description: desc, openGraph: { title: `${p.name} — ${price}`, description: desc, type: 'website', images: img ? [{ url: img }] : undefined }, twitter: { card: 'summary_large_image', title: `${p.name} — ${price}`, description: desc, images: img ? [img] : undefined } };
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const r = await load(slug); if (!r) notFound(); const { s, p } = r;
  const [{ data: ratings }, { data: reviews }, { data: related }, { data: delivery }, { data: wa }] = await Promise.all([
    // Same source as the product cards (approved reviews only), so card and page never disagree.
    s.from('product_reviews').select('rating').eq('product_id', p.id).eq('moderation_status', 'approved').limit(2000),
    s.from('product_reviews').select('id,customer_name,rating,review_title,review_text,created_at').eq('product_id', p.id).eq('moderation_status', 'approved').order('created_at', { ascending: false }).limit(20),
    s.rpc('get_related_products', { p_product_id: p.id, p_limit: 4 }),
    s.from('website_settings').select('setting_value').eq('setting_key', 'delivery').maybeSingle(),
    s.from('website_settings').select('setting_value').eq('setting_key', 'whatsapp').maybeSingle()
  ]);
  const rs = (ratings || []) as { rating: number }[]; const breakdown = [0, 0, 0, 0, 0, 0];
  rs.forEach(x => { breakdown[x.rating] = (breakdown[x.rating] || 0) + 1; });
  const rating = { count: rs.length, average: rs.length ? Math.round((rs.reduce((a, x) => a + x.rating, 0) / rs.length) * 10) / 10 : 0, breakdown };
  // Related products: RPC picks first, then same category, then featured/newest, so the section is never empty while other products exist.
  const rpcIds = ((related || []) as { id: string }[]).map(x => x.id);
  const { data: pool } = await s.from('products').select('id,name,slug,description,price,sale_price,stock_quantity,is_featured,category_id,categories(name),product_images(image_url,display_order)').eq('is_active', true).neq('id', p.id).order('created_at', { ascending: false }).limit(40);
  const cands = (pool || []) as unknown as (Product & { category_id: string | null })[];
  const score = (x: Product & { category_id: string | null }) => (rpcIds.includes(x.id) ? 0 : 1000) + (rpcIds.includes(x.id) ? rpcIds.indexOf(x.id) : 0) + (p.category_id && x.category_id === p.category_id ? 0 : 100) + (x.is_featured ? 0 : 10) + (x.stock_quantity > 0 ? 0 : 500);
  const relatedProducts = [...cands].sort((a, b) => score(a) - score(b)).slice(0, 4) as Product[];
  const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;
  return <ProductDetail product={{ id: p.id, name: p.name, slug: p.slug, description: p.description, price: p.price, sale_price: p.sale_price, stock_quantity: p.stock_quantity, category: cat?.name || null, images: [...((p.product_images || []) as Img[])].sort((a, b) => a.display_order - b.display_order), rating, reviews: reviews || [], related: relatedProducts }} deliveryFee={Number((delivery?.setting_value as { delivery_fee?: number } | null)?.delivery_fee ?? 0)} supportNumber={String((wa?.setting_value as { support_number?: string; order_receiving_number?: string } | null)?.support_number || (wa?.setting_value as { order_receiving_number?: string } | null)?.order_receiving_number || '')} />;
}
