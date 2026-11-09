import { NextResponse } from 'next/server';
import { getAuthorizedAdmin } from '@/lib/auth/api-admin';
export const dynamic = 'force-dynamic';
type Item = { product_id: string | null; product_name_snapshot: string; quantity: number; item_total: number };
type Order = { id: string; customer_phone: string; customer_city: string; total_amount: number; payment_method: string; payment_status: string; order_status: string; created_at: string; order_items: Item[] };
type Prod = { id: string; name: string; price: number; stock_quantity: number; is_active: boolean; category_id: string | null; categories: { name: string } | { name: string }[] | null };
const catName = (p: Prod) => (Array.isArray(p.categories) ? p.categories[0]?.name : p.categories?.name) || 'Uncategorised';
const city = (c: string) => c.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\b\w/g, m => m.toUpperCase()) || 'Unknown';
const day = (iso: string) => new Date(new Date(iso).getTime() + 5 * 3600 * 1000).toISOString().slice(0, 10); // Pakistan time (UTC+5)
const top = <T extends { value: number }>(arr: T[], n: number) => [...arr].sort((a, b) => b.value - a.value).slice(0, n);

export async function GET(req: Request) {
  const { supabase: s, user } = await getAuthorizedAdmin(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get('days')) || 30)); const from = new Date(Date.now() - days * 86400000).toISOString();
  const [{ data: ordersRaw, error: e1 }, { data: prodsRaw }, { data: allPhones }, { data: ratingsRaw }, beh] = await Promise.all([
    s.from('orders').select('id,customer_phone,customer_city,total_amount,payment_method,payment_status,order_status,created_at,order_items(product_id,product_name_snapshot,quantity,item_total)').gte('created_at', from).order('created_at', { ascending: false }).limit(5000),
    s.from('products').select('id,name,price,stock_quantity,is_active,category_id,categories(name)').limit(2000),
    s.from('orders').select('customer_phone').limit(50000),
    s.from('product_reviews').select('product_id,rating').eq('moderation_status', 'approved').limit(10000),
    s.rpc('admin_get_behavior_insights', { p_days: days })
  ]);
  if (e1) return NextResponse.json({ error: e1.message }, { status: 400 });
  const orders = (ordersRaw || []) as unknown as Order[]; const prods = (prodsRaw || []) as unknown as Prod[]; const pmap = new Map(prods.map(p => [p.id, p]));
  const live = orders.filter(o => !['cancelled', 'abandoned'].includes(o.order_status)); // real demand
  const verified = live.filter(o => o.payment_status === 'verified'); const pending = live.filter(o => ['awaiting_payment', 'verification_pending'].includes(o.payment_status));
  const sum = (a: Order[]) => a.reduce((t, o) => t + Number(o.total_amount), 0);
  // customers (by phone)
  const phoneCount = new Map<string, number>(); (allPhones || []).forEach((r: { customer_phone: string }) => phoneCount.set(r.customer_phone, (phoneCount.get(r.customer_phone) || 0) + 1));
  const periodPhones = new Set(live.map(o => o.customer_phone)); const returning = [...periodPhones].filter(p => (phoneCount.get(p) || 0) >= 2).length;
  // products
  const sold = new Map<string, { name: string; units: number; revenue: number; cancelled: number }>();
  const catAgg = new Map<string, { units: number; revenue: number }>();
  orders.forEach(o => o.order_items.forEach(it => { const key = it.product_id || it.product_name_snapshot; const row = sold.get(key) || { name: it.product_name_snapshot, units: 0, revenue: 0, cancelled: 0 };
    if (['cancelled', 'abandoned'].includes(o.order_status) || o.payment_status === 'rejected') row.cancelled += it.quantity; else { row.units += it.quantity; row.revenue += Number(it.item_total); const c = catName(pmap.get(it.product_id || '') as Prod || { categories: null } as Prod); const a = catAgg.get(c) || { units: 0, revenue: 0 }; a.units += it.quantity; a.revenue += Number(it.item_total); catAgg.set(c, a); }
    sold.set(key, row); }));
  const bestSellers = top([...sold.entries()].map(([id, r]) => ({ id, ...r, value: r.units })), 10);
  const slow = prods.filter(p => p.is_active && !sold.has(p.id) || (p.is_active && (sold.get(p.id)?.units || 0) === 0)).slice(0, 10).map(p => ({ id: p.id, name: p.name, stock: p.stock_quantity, category: catName(p) }));
  const lowStock = prods.filter(p => p.is_active && p.stock_quantity <= 5).sort((a, b) => a.stock_quantity - b.stock_quantity).slice(0, 10).map(p => ({ id: p.id, name: p.name, stock: p.stock_quantity, units: sold.get(p.id)?.units || 0 }));
  const ra = new Map<string, { sum: number; n: number }>(); (ratingsRaw || []).forEach((r: { product_id: string; rating: number }) => { const a = ra.get(r.product_id) || { sum: 0, n: 0 }; a.sum += r.rating; a.n += 1; ra.set(r.product_id, a); });
  const lowRated = [...ra.entries()].filter(([, a]) => a.n >= 2 && a.sum / a.n < 3.5).map(([id, a]) => ({ id, name: pmap.get(id)?.name || 'Product', rating: Math.round((a.sum / a.n) * 10) / 10, reviews: a.n }));
  const returnsProblem = top([...sold.entries()].filter(([, r]) => r.cancelled > 0).map(([id, r]) => ({ id, name: r.name, cancelled: r.cancelled, units: r.units, value: r.cancelled })), 8);
  // geography / payment / status / time
  const cityAgg = new Map<string, { orders: number; revenue: number }>(); live.forEach(o => { const c = city(o.customer_city); const a = cityAgg.get(c) || { orders: 0, revenue: 0 }; a.orders += 1; a.revenue += Number(o.total_amount); cityAgg.set(c, a); });
  const cities = top([...cityAgg.entries()].map(([name, a]) => ({ name, ...a, value: a.orders })), 10);
  const payments = ['easypaisa', 'jazzcash'].map(m => ({ method: m, orders: live.filter(o => o.payment_method === m).length }));
  const statuses: Record<string, number> = {}; orders.forEach(o => { statuses[o.order_status] = (statuses[o.order_status] || 0) + 1; });
  const daily = new Map<string, { orders: number; revenue: number }>(); live.forEach(o => { const d = day(o.created_at); const a = daily.get(d) || { orders: 0, revenue: 0 }; a.orders += 1; a.revenue += o.payment_status === 'verified' ? Number(o.total_amount) : 0; daily.set(d, a); });
  const weekdays = [0, 0, 0, 0, 0, 0, 0]; live.forEach(o => { weekdays[new Date(new Date(o.created_at).getTime() + 5 * 3600 * 1000).getUTCDay()] += 1; });
  const behavior = beh.error ? null : beh.data; const funnel = (behavior?.funnel || {}) as Record<string, number>;
  // rule-based recommendations (not AI): each one is traceable to the numbers above
  const tips: string[] = [];
  const nr = (behavior?.no_result_searches || []) as { query: string; count: number }[]; if (nr.length) tips.push(`Customers searched for "${nr[0].query}" ${nr[0].count} time(s) and found nothing. Consider stocking it or adding it to product names/descriptions.`);
  const hv = ((behavior?.products || []) as { name: string; views: number; carts: number }[]).filter(p => p.views >= 10 && p.carts / p.views < 0.05)[0]; if (hv) tips.push(`"${hv.name}" gets ${hv.views} views but very few add-to-bags. Check its price, photos and description.`);
  const ls = lowStock.filter(p => p.units > 0)[0]; if (ls) tips.push(`"${ls.name}" is selling but only ${ls.stock} left. Restock soon.`);
  if (cities[0] && live.length >= 5) tips.push(`${cities[0].name} is your top city (${Math.round(cities[0].orders / live.length * 100)}% of orders). Target ads and WhatsApp broadcasts there first.`);
  const src = ((behavior?.sources || []) as { source: string; sessions: number }[])[0]; if (src) tips.push(`Most visitors come from "${src.source}". Put your best products and links there.`);
  if (lowRated[0]) tips.push(`"${lowRated[0].name}" has an average rating of ${lowRated[0].rating}. Read its reviews and fix the quality or description.`);
  if (returning === 0 && live.length >= 10) tips.push('No repeat customers yet. A WhatsApp thank-you message with a next-order offer can start repeat buying.');
  if (!behavior) tips.push('Behaviour data (searches, sources, views per product) will appear after you run migration 0003 and visitors browse the store.');
  return NextResponse.json({ days, kpis: { orders: orders.length, live_orders: live.length, verified_revenue: sum(verified), pending_value: sum(pending), aov: live.length ? Math.round(sum(live) / live.length) : 0, cancelled: orders.length - live.length, customers: periodPhones.size, returning_customers: returning, items_sold: [...sold.values()].reduce((t, r) => t + r.units, 0) },
    best_sellers: bestSellers, slow_movers: slow, low_stock: lowStock, low_rated: lowRated, cancelled_products: returnsProblem, categories: top([...catAgg.entries()].map(([name, a]) => ({ name, ...a, value: a.revenue })), 10), cities, payments, statuses, weekdays,
    daily: [...daily.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, a]) => ({ date, ...a })), behavior, funnel, tips });
}
