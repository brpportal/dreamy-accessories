'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Heart, SlidersHorizontal, X, SearchX, ChevronRight } from 'lucide-react';
import ProductCard, { type Product } from '@/components/product-card';
import AddedOverlay, { type AddedItem } from '@/components/added-overlay';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import WhatsAppFab from '@/components/whatsapp-fab';
import { Dropdown } from '@/components/ui';
import { trackEvent } from '@/components/analytics-tracker';
import { addLine, openCart } from '@/lib/cart';
import { effectivePrice, isOnSale, discountPercent, isPurchasable } from '@/lib/format';

type Sort = 'featured' | 'newest' | 'low' | 'high' | 'rated' | 'saving';
const SORTS: { value: Sort; label: string }[] = [{ value: 'featured', label: 'Featured' }, { value: 'newest', label: 'Newest' }, { value: 'low', label: 'Price: Low to High' }, { value: 'high', label: 'Price: High to Low' }, { value: 'rated', label: 'Top Rated' }, { value: 'saving', label: 'Biggest Saving' }];
const PRICES: { label: string; test: (n: number) => boolean }[] = [
  { label: 'All prices', test: () => true }, { label: 'Under Rs. 1,000', test: n => n < 1000 }, { label: 'Rs. 1,000 – 3,000', test: n => n >= 1000 && n <= 3000 },
  { label: 'Rs. 3,000 – 5,000', test: n => n > 3000 && n <= 5000 }, { label: 'Above Rs. 5,000', test: n => n > 5000 }
];
const firstImg = (p: Product) => [...(p.product_images || [])].sort((a, b) => a.display_order - b.display_order)[0]?.image_url || '';
const ring = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a83c70] focus-visible:ring-offset-2';

type FilterState = { category: string; saved: boolean; price: number; inStock: boolean; onSale: boolean };
function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-1 text-sm ${ring}`}><span>{label}</span><span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-[#a83c70]' : 'bg-pink-200'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} /></span></button>;
}
function Choice({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-sm transition ${active ? 'bg-[#a83c70] font-semibold text-white' : 'text-[#352331] hover:bg-pink-50'} ${ring}`}><span className="flex items-center gap-2">{children}</span>{count !== undefined && <span className={`text-xs tabular ${active ? 'text-pink-100' : 'text-[#8a7380]'}`}>{count}</span>}</button>;
}
function FilterPanel({ f, set, categories, counts, savedCount, totalCount }: { f: FilterState; set: (p: Partial<FilterState>) => void; categories: string[]; counts: Record<string, number>; savedCount: number; totalCount: number }) {
  return <div className="space-y-7">
    <div><p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[.2em] text-[#a83c70]">Category</p><div className="space-y-0.5">
      <Choice active={f.category === 'All' && !f.saved} onClick={() => set({ category: 'All', saved: false })} count={totalCount}>All products</Choice>
      {categories.map(c => <Choice key={c} active={f.category === c && !f.saved} onClick={() => set({ category: c, saved: false })} count={counts[c] || 0}>{c}</Choice>)}
      <Choice active={f.saved} onClick={() => set({ saved: true, category: 'All' })} count={savedCount}><Heart size={14} /> Saved</Choice></div></div>
    <div><p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[.2em] text-[#a83c70]">Price</p><div className="space-y-0.5">{PRICES.map((r, i) => <Choice key={r.label} active={f.price === i} onClick={() => set({ price: i })}>{r.label}</Choice>)}</div></div>
    <div><p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-[.2em] text-[#a83c70]">Availability</p><Switch on={f.inStock} onChange={v => set({ inStock: v })} label="In stock only" /><Switch on={f.onSale} onChange={v => set({ onSale: v })} label="On sale" /></div>
  </div>;
}

export default function ProductsPage() {
  const params = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState(''); const [sort, setSort] = useState<Sort>('featured');
  const [f, setF] = useState<FilterState>(() => ({ category: 'All', saved: Boolean(params.get('wishlist')), price: 0, inStock: false, onSale: false }));
  const [wish, setWish] = useState<string[]>([]); const [addedItem, setAddedItem] = useState<AddedItem | null>(null); const [sheet, setSheet] = useState(false);
  const set = (p: Partial<FilterState>) => setF(old => ({ ...old, ...p }));

  useEffect(() => {
    fetch('/api/products').then(r => { if (!r.ok) throw new Error('bad'); return r.json(); }).then(d => setProducts(d.products || [])).catch(() => setFailed(true)).finally(() => setLoading(false));
    try { setWish(JSON.parse(localStorage.getItem('da-wishlist') || '[]')); } catch { /* ignore */ }
  }, []);
  useEffect(() => { if (!sheet) return; const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'; const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheet(false); }; window.addEventListener('keydown', esc); return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc); }; }, [sheet]);

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.categories?.name).filter(Boolean) as string[])), [products]);
  const counts = useMemo(() => { const m: Record<string, number> = {}; products.forEach(p => { const c = p.categories?.name; if (c) m[c] = (m[c] || 0) + 1; }); return m; }, [products]);
  const savedCount = products.filter(p => wish.includes(p.id)).length;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase(); const price = PRICES[f.price]; const idx = new Map(products.map((p, i) => [p.id, i])); const byIdx = (a: Product, b: Product) => (idx.get(a.id) as number) - (idx.get(b.id) as number);
    const list = products.filter(p => (!q || p.name.toLowerCase().includes(q) || (p.categories?.name || '').toLowerCase().includes(q)) && (f.saved ? wish.includes(p.id) : f.category === 'All' || p.categories?.name === f.category) && price.test(effectivePrice(p)) && (!f.inStock || isPurchasable(p)) && (!f.onSale || isOnSale(p)));
    const rate = (p: Product) => (p.rating_count ? p.rating_average || 0 : -1);
    return [...list].sort((a, b) => sort === 'low' ? effectivePrice(a) - effectivePrice(b) || byIdx(a, b) : sort === 'high' ? effectivePrice(b) - effectivePrice(a) || byIdx(a, b)
      : sort === 'rated' ? rate(b) - rate(a) || (b.rating_count || 0) - (a.rating_count || 0) || byIdx(a, b) : sort === 'saving' ? discountPercent(b) - discountPercent(a) || byIdx(a, b)
      : sort === 'featured' ? Number(b.is_featured) - Number(a.is_featured) || byIdx(a, b) : byIdx(a, b));
  }, [products, query, f, wish, sort]);

  useEffect(() => { const q = query.trim(); if (q.length < 2 || loading) return; const t = setTimeout(() => trackEvent('search', { metadata: { query: q.slice(0, 80), results: shown.length } }), 900); return () => clearTimeout(t); }, [query, shown.length, loading]);

  const activeCount = (f.category !== 'All' ? 1 : 0) + (f.saved ? 1 : 0) + (f.price !== 0 ? 1 : 0) + (f.inStock ? 1 : 0) + (f.onSale ? 1 : 0);
  const anyFilter = activeCount > 0 || query.trim() !== '';
  const clearAll = () => { setF({ category: 'All', saved: false, price: 0, inStock: false, onSale: false }); setQuery(''); setSort('featured'); };
  function add(p: Product) { if (!isPurchasable(p)) return; addLine({ id: p.id, name: p.name, price: effectivePrice(p), originalPrice: isOnSale(p) ? p.price : undefined, image: firstImg(p), stock: p.stock_quantity }); trackEvent('add_to_cart', { productId: p.id }); setAddedItem({ name: p.name, image: firstImg(p) }); }
  const toggleWish = (id: string) => setWish(w => { const n = w.includes(id) ? w.filter(x => x !== id) : [...w, id]; if (!w.includes(id)) trackEvent('wishlist_add', { productId: id }); try { localStorage.setItem('da-wishlist', JSON.stringify(n)); } catch { /* ignore */ } return n; });
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (query.trim()) chips.push({ key: 'q', label: `“${query.trim()}”`, clear: () => setQuery('') });
  if (f.saved) chips.push({ key: 's', label: 'Saved', clear: () => set({ saved: false }) });
  if (f.category !== 'All') chips.push({ key: 'c', label: f.category, clear: () => set({ category: 'All' }) });
  if (f.price !== 0) chips.push({ key: 'p', label: PRICES[f.price].label, clear: () => set({ price: 0 }) });
  if (f.inStock) chips.push({ key: 'i', label: 'In stock', clear: () => set({ inStock: false }) });
  if (f.onSale) chips.push({ key: 'o', label: 'On sale', clear: () => set({ onSale: false }) });

  return <div className="min-h-screen bg-[#fff9fc] text-[#352331]">
    <SiteHeader />
    <section className="relative overflow-hidden border-b border-pink-100 bg-gradient-to-br from-[#fdeaf3] via-[#fff9fc] to-[#fbe3ee]">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-pink-200/50 blur-3xl" /><div className="pointer-events-none absolute -bottom-24 left-10 h-60 w-60 rounded-full bg-rose-100/70 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-8 md:pb-16 md:pt-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-[#6b5360]"><Link href="/" className="hover:text-[#a83c70]">Home</Link><ChevronRight size={12} /><span className="text-[#352331]">Products</span></nav>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[.3em] text-[#a83c70]">The Collection</p>
        <h1 className="mt-3 font-serif text-4xl leading-[1.1] text-[#4a2b3c] md:text-6xl">All <em className="text-[#a83c70]">Products</em></h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-[#6b5360] md:text-base">Thoughtfully picked pieces that make everyday feel a little more lovely.</p>
      </div>
    </section>

    <main className="mx-auto grid max-w-7xl gap-10 px-5 py-8 lg:grid-cols-[250px_1fr] lg:py-12">
      <aside className="hidden lg:block"><div className="sticky top-24 rounded-3xl border border-pink-100 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="font-serif text-xl">Filters</h2>{anyFilter && <button type="button" onClick={clearAll} className="text-xs font-semibold text-[#a83c70] underline">Clear all</button>}</div><FilterPanel f={f} set={set} categories={categories} counts={counts} savedCount={savedCount} totalCount={products.length} /></div></aside>

      <section aria-label="Products" className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex min-h-12 flex-1 items-center gap-2.5 rounded-full border border-pink-200 bg-white px-5 shadow-sm focus-within:ring-2 focus-within:ring-[#a83c70]"><Search size={17} className="shrink-0 text-[#a83c70]" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products…" aria-label="Search products" className="w-full bg-transparent text-sm outline-none placeholder:text-[#8a7380]" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="grid h-8 w-8 place-items-center rounded-full text-[#6b5360] hover:bg-pink-50"><X size={15} /></button>}</label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setSheet(true)} className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-pink-200 bg-white px-5 text-sm font-medium shadow-sm lg:hidden ${ring}`}><SlidersHorizontal size={16} className="text-[#a83c70]" />Filters{activeCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#a83c70] px-1 text-[10px] font-bold text-white">{activeCount}</span>}</button>
            <div className="flex-1 sm:w-60 sm:flex-none"><Dropdown<Sort> ariaLabel="Sort products" label="Sort:" value={sort} onChange={setSort} options={SORTS} /></div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2"><p className="mr-1 text-xs text-[#6b5360]" aria-live="polite">{loading ? 'Loading products…' : `${shown.length} product${shown.length === 1 ? '' : 's'}`}</p>
          {chips.map(c => <button key={c.key} type="button" onClick={c.clear} aria-label={`Remove filter ${c.label}`} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full bg-pink-50 px-3 text-xs font-medium text-[#a83c70] transition hover:bg-pink-100 ${ring}`}>{c.label}<X size={12} /></button>)}
          {chips.length > 1 && <button type="button" onClick={clearAll} className="text-xs font-semibold text-[#6b5360] underline">Clear all</button>}</div>

        {loading ? <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6" aria-busy="true">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="overflow-hidden rounded-[1.35rem] border border-pink-100 bg-white"><div className="da-skeleton aspect-[4/5]" /><div className="space-y-2 p-4"><div className="da-skeleton h-3 w-1/3 rounded" /><div className="da-skeleton h-4 w-4/5 rounded" /><div className="da-skeleton h-4 w-1/2 rounded" /></div></div>)}</div>
          : failed ? <div className="mt-6 rounded-3xl border border-pink-200 bg-white px-6 py-14 text-center"><p className="font-serif text-2xl">We could not load the collection</p><p className="mt-2 text-sm text-[#6b5360]">Please check your connection and try again.</p><button type="button" onClick={() => location.reload()} className={`mt-5 min-h-12 rounded-full bg-[#a83c70] px-8 text-sm font-semibold text-white ${ring}`}>Try again</button></div>
          : shown.length === 0 ? <div className="mt-6 rounded-3xl border border-dashed border-pink-200 bg-white px-6 py-14 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-pink-50 text-[#a83c70]">{f.saved && !query ? <Heart size={26} /> : <SearchX size={26} />}</span>
              <p className="mt-4 font-serif text-2xl">{query.trim() ? `No products found for “${query.trim()}”` : f.saved ? 'Your saved list is empty' : 'Nothing matches these filters'}</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[#6b5360]">{query.trim() ? 'Try a different search, or browse a category below.' : f.saved ? 'Tap the heart on any product to save it here.' : 'Try removing a filter to see more.'}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">{categories.slice(0, 3).map(c => <button key={c} type="button" onClick={() => { setQuery(''); setF({ category: c, saved: false, price: 0, inStock: false, onSale: false }); }} className={`min-h-11 rounded-full border border-pink-200 bg-white px-5 text-sm font-medium transition hover:border-[#a83c70] ${ring}`}>{c}</button>)}<button type="button" onClick={clearAll} className={`min-h-11 rounded-full bg-[#a83c70] px-6 text-sm font-semibold text-white ${ring}`}>View all products</button></div></div>
          : <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6">{shown.map(p => <ProductCard key={p.id} p={p} onAdd={add} hideAdd wished={wish.includes(p.id)} onWish={toggleWish} />)}</div>}
      </section>
    </main>
    <SiteFooter />
    <WhatsAppFab flush />
    <AddedOverlay item={addedItem} onClose={() => setAddedItem(null)} onViewCart={() => { setAddedItem(null); openCart(); }} />

    {sheet && <div className="fixed inset-0 z-[85] flex items-end bg-[#352331]/45 backdrop-blur-[2px] lg:hidden" onClick={() => setSheet(false)}><div role="dialog" aria-modal="true" aria-label="Filters" className="da-sheet flex max-h-[88vh] w-full flex-col rounded-t-[2rem] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-pink-200" /><div className="flex items-center justify-between px-6 pb-2 pt-3"><h2 className="font-serif text-2xl">Filters</h2><button type="button" onClick={() => setSheet(false)} aria-label="Close filters" className="grid h-11 w-11 place-items-center rounded-full hover:bg-pink-50"><X size={20} /></button></div>
      <div className="flex-1 overflow-y-auto px-6 pb-4"><FilterPanel f={f} set={set} categories={categories} counts={counts} savedCount={savedCount} totalCount={products.length} /></div>
      <div className="grid grid-cols-[auto_1fr] gap-3 border-t border-pink-100 px-6 pt-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}><button type="button" onClick={clearAll} className="min-h-12 rounded-full border border-pink-200 px-6 text-sm font-semibold">Clear</button><button type="button" onClick={() => setSheet(false)} className="min-h-12 rounded-full bg-[#a83c70] px-6 text-sm font-semibold text-white">Show {shown.length} product{shown.length === 1 ? '' : 's'}</button></div></div></div>}
  </div>;
}
