'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/components/analytics-tracker';
import ProductCard, { type Product } from '@/components/product-card';
import { Accordion, Dropdown, Eyebrow, Stars } from '@/components/ui';
import WhatsAppFab from '@/components/whatsapp-fab';
import { faqItems } from '@/lib/content/faq';
import { money, effectivePrice, isOnSale, isPurchasable } from '@/lib/format';
import { lineKey } from '@/lib/cart';
import { ShoppingBag, Search, Sparkles, Truck, ShieldCheck, Wallet, MessageCircle, Gem, HeartHandshake, Headset, Menu, X, Minus, Plus, Instagram, Facebook, BadgeCheck, SearchX, CheckCircle2 } from 'lucide-react';

type CartLine = { id: string; name: string; price: number; originalPrice?: number; image: string; quantity: number; stock?: number; variant?: string };
type Settings = { storeName: string; announcement: string; deliveryFee: number; supportNumber: string; instagram: string; facebook: string };
type Review = { id: string; name: string; rating: number; title: string | null; excerpt: string; product: string };
type Sort = 'featured' | 'low' | 'high' | 'newest' | 'rated';
const PRICE_RANGES: { label: string; test: (n: number) => boolean }[] = [
  { label: 'All Prices', test: () => true }, { label: 'Under Rs. 1,000', test: n => n < 1000 }, { label: 'Rs. 1,000–3,000', test: n => n >= 1000 && n <= 3000 },
  { label: 'Rs. 3,000–5,000', test: n => n > 3000 && n <= 5000 }, { label: 'Above Rs. 5,000', test: n => n > 5000 }
];
const cap = (stock?: number) => Math.min(20, stock ?? 20);

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]); const [cart, setCart] = useState<CartLine[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [settings, setSettings] = useState<Settings | null>(null); const [reviews, setReviews] = useState<Review[]>([]);
  const [cartOpen, setCartOpen] = useState(false); const [menuOpen, setMenuOpen] = useState(false); const [scrolled, setScrolled] = useState(false); const [pulse, setPulse] = useState(false); const [toast, setToast] = useState(false);
  const [wish, setWish] = useState<string[]>([]); const [removing, setRemoving] = useState<string | null>(null); const [toastName, setToastName] = useState('');
  const [covers, setCovers] = useState<{ name: string; image_url: string }[]>([]);
  const [search, setSearch] = useState(''); const [category, setCategory] = useState('All'); const [range, setRange] = useState(0); const [sort, setSort] = useState<Sort>('featured');
  const cartLoaded = useRef(false); const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem('da-cart') || '[]')); } catch {}
    try { setWish(JSON.parse(localStorage.getItem('da-wishlist') || '[]')); } catch {}
    cartLoaded.current = true;
    fetch('/api/products').then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setProducts(d.products || []); setCovers(d.categoryCovers || []); }).catch(e => setError(e.message)).finally(() => setLoading(false));
    fetch('/api/site-settings').then(r => r.ok ? r.json() : null).then(d => d && setSettings(d)).catch(() => {});
    fetch('/api/reviews/featured').then(r => r.ok ? r.json() : { reviews: [] }).then(d => setReviews(d.reviews || [])).catch(() => {});
    const onScroll = () => setScrolled(window.scrollY > 8); onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { if (!cartLoaded.current) return; try { localStorage.setItem('da-cart', JSON.stringify(cart)); } catch {} }, [cart]);

  const fee = settings?.deliveryFee ?? 0;
  const count = cart.reduce((s, x) => s + x.quantity, 0);
  const subtotal = cart.reduce((s, x) => s + x.price * x.quantity, 0);
  const toggleWish = (id: string) => setWish(w => { const n = w.includes(id) ? w.filter(x => x !== id) : [...w, id]; if (!w.includes(id)) trackEvent('wishlist_add', { productId: id }); try { localStorage.setItem('da-wishlist', JSON.stringify(n)); } catch {} return n; });

  const add = useCallback((p: Product) => {
    if (!isPurchasable(p)) return;
    trackEvent('add_to_cart', { productId: p.id });
    const image = [...(p.product_images || [])].sort((a, b) => a.display_order - b.display_order)[0]?.image_url || '';
    setCart(old => { const ex = old.find(x => x.id === p.id && !x.variant); const max = cap(p.stock_quantity);
      return ex ? old.map(x => x.id === p.id && !x.variant ? { ...x, stock: p.stock_quantity, quantity: Math.min(max, x.quantity + 1) } : x)
        : [...old, { id: p.id, name: p.name, price: effectivePrice(p), originalPrice: isOnSale(p) ? p.price : undefined, image, quantity: 1, stock: p.stock_quantity }]; });
    setPulse(false); requestAnimationFrame(() => setPulse(true)); setTimeout(() => setPulse(false), 600);
    setToastName(p.name); setToast(true); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(false), 4000);
  }, []);
  const setQty = (key: string, d: number) => setCart(c => c.map(x => lineKey(x) === key ? { ...x, quantity: Math.max(1, Math.min(cap(x.stock), x.quantity + d)) } : x));
  const remove = (key: string) => { const line = cart.find(x => lineKey(x) === key); trackEvent('remove_from_cart', { productId: line?.id || key }); setRemoving(key); setTimeout(() => { setCart(c => c.filter(x => lineKey(x) !== key)); setRemoving(null); }, 220); };

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.categories?.name).filter(Boolean) as string[])), [products]);
  const coverMap = useMemo(() => new Map(covers.map(c => [c.name, c.image_url])), [covers]);
  const catTiles = useMemo(() => categories.map(name => ({ name, image: coverMap.get(name) || products.filter(p => p.categories?.name === name).flatMap(p => [...(p.product_images || [])].sort((a, b) => a.display_order - b.display_order).slice(0, 1))[0]?.image_url || '' })), [categories, products, coverMap]);
  const featured = useMemo(() => products.filter(p => p.is_featured), [products]);
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase(); const r = PRICE_RANGES[range];
    const list = products.filter(p => (!q || p.name.toLowerCase().includes(q) || (p.categories?.name || '').toLowerCase().includes(q)) && (category === 'All' || p.categories?.name === category) && r.test(effectivePrice(p)));
    const idx = new Map(products.map((p, i) => [p.id, i]));
    const byIdx = (a: Product, b: Product) => (idx.get(a.id) as number) - (idx.get(b.id) as number);
    return [...list].sort((a, b) => sort === 'low' ? effectivePrice(a) - effectivePrice(b) || byIdx(a, b) : sort === 'high' ? effectivePrice(b) - effectivePrice(a) || byIdx(a, b)
      : sort === 'rated' ? ((b.rating_count ? b.rating_average || 0 : -1) - (a.rating_count ? a.rating_average || 0 : -1)) || byIdx(a, b)
      : sort === 'featured' ? (Number(b.is_featured) - Number(a.is_featured)) || byIdx(a, b) : byIdx(a, b));
  }, [products, search, category, range, sort]);
  useEffect(() => { const q = search.trim(); if (q.length < 2 || loading) return; const t = setTimeout(() => trackEvent('search', { metadata: { query: q.slice(0, 80), results: shown.length } }), 900); return () => clearTimeout(t); }, [search, shown.length, loading]);
  const pickCategory = (c: string) => { setCategory(c); if (c !== 'All') { const id = products.find(p => p.categories?.name === c)?.category_id; trackEvent('category_view', id ? { categoryId: id } : {}); } };
  const filtersActive = search !== '' || category !== 'All' || range !== 0 || sort !== 'featured';
  const clear = () => { setSearch(''); setCategory('All'); setRange(0); setSort('featured'); };
  const goShop = (cat?: string) => { if (cat) pickCategory(cat); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); };
  const chip = (on: boolean) => `min-h-11 shrink-0 rounded-full border px-4 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a83c70] ${on ? 'border-[#a83c70] bg-[#a83c70] text-white' : 'border-pink-200 bg-white text-[#4a2b3c] hover:border-[#a83c70]'}`;
  const wa = (settings?.supportNumber || '').replace(/\D/g, '');

  const trust = [{ i: Truck, t: 'Nationwide Delivery' }, { i: ShieldCheck, t: 'Secure Advance Payment' }, { i: Wallet, t: 'Easypaisa & JazzCash' }, { i: MessageCircle, t: 'WhatsApp Order Confirmation' }];
  const usps = [{ i: Gem, t: 'Premium Quality', d: 'Every piece is checked before it ships.' }, { i: HeartHandshake, t: 'Handpicked with Love', d: 'Chosen to make everyday style feel special.' }, { i: Truck, t: 'Flat Nationwide Delivery', d: fee ? `One simple fee of ${money(fee)} anywhere in Pakistan.` : 'One simple flat fee anywhere in Pakistan.' }, { i: Headset, t: 'Easy WhatsApp Support', d: 'Real people, one message away.' }];
  const ring = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a83c70] focus-visible:ring-offset-2';

  return <main className="min-h-screen bg-[#fff9fc] pb-16 text-[#352331] md:pb-0">
    <div className="bg-[#a83c70] px-4 py-2 text-center text-xs tracking-wide text-white">{settings?.announcement || 'Beautiful Finds, Delivered Across Pakistan'}</div>
    <header className={`sticky top-0 z-30 border-b border-pink-100 bg-white/90 backdrop-blur transition-shadow ${scrolled ? 'shadow-md shadow-pink-100/60' : ''}`}><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
      <Link href="/" className="flex items-center gap-2.5"><img src="/logo.jpg" alt="Sparklesbyfarry logo" className="h-11 w-11 rounded-xl object-cover ring-1 ring-pink-200" /><span className="font-serif text-[1.35rem] font-bold leading-none tracking-tight text-[#a83c70]">Sparkles<span className="text-[#352331]">byfarry</span></span></Link>
      <nav className="hidden items-center gap-8 text-sm md:flex" aria-label="Main"><a href="#home" className="hover:text-[#a83c70]">Home</a><Link href="/products" className="hover:text-[#a83c70]">Products</Link><a href="#why-us" className="hover:text-[#a83c70]">Why Us</a><Link href="/track-order" className="hover:text-[#a83c70]">Track Order</Link></nav>
      <div className="flex items-center gap-2">
        <button onClick={() => { setCartOpen(true); setToast(false); }} className={`relative grid h-11 w-11 place-items-center rounded-full bg-pink-50 text-[#a83c70] ${ring}`} aria-label={`Open bag, ${count} items`}><ShoppingBag size={19} /><span className={`absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#a83c70] px-1 text-[10px] text-white ${pulse ? 'da-pulse' : ''}`}>{count}</span></button>
        <button onClick={() => setMenuOpen(!menuOpen)} className={`grid h-11 w-11 place-items-center rounded-full text-[#a83c70] md:hidden ${ring}`} aria-label="Toggle menu" aria-expanded={menuOpen}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </div></div>
      {menuOpen && <nav className="border-t border-pink-100 bg-white px-4 py-2 md:hidden" aria-label="Mobile">{[['#home', 'Home'], ['#why-us', 'Why Us']].map(([h, l]) => <a key={h} href={h} onClick={() => setMenuOpen(false)} className="block min-h-11 py-3 text-sm">{l}</a>)}<Link href="/products" onClick={() => setMenuOpen(false)} className="block min-h-11 py-3 text-sm">Products</Link><Link href="/track-order" className="block min-h-11 py-3 text-sm">Track Order</Link></nav>}
    </header>

    <section aria-label="Sparklesbyfarry banner" className="mx-auto max-w-7xl px-5 pt-6"><img src="/banner.jpg" alt="Sparklesbyfarry — sheet masks, matte lip gloss and strawberry lip gloss" className="w-full rounded-[2rem] border border-pink-100 shadow-xl shadow-pink-100" /></section>

    <section id="home" className="relative overflow-hidden"><div className="absolute -right-24 -top-20 h-80 w-80 rounded-full bg-pink-200/50 blur-3xl" /><div className="mx-auto max-w-3xl px-5 py-14 text-center md:py-20"><div className="relative">
      <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[.18em] text-[#a83c70]"><Sparkles size={14} /> Little things, lovely moments</p>
      <h1 className="mx-auto max-w-xl font-serif text-[2.25rem] leading-[1.1] text-[#4a2b3c] md:text-6xl">A little sparkle for <em className="text-[#a83c70]">every you.</em></h1>
      <p className="mx-auto mt-5 max-w-md text-base leading-7 text-[#6b5360]">Thoughtfully picked accessories that make your everyday style feel extra special.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/products" className={`inline-flex min-h-12 items-center rounded-full bg-[#a83c70] px-8 text-sm font-semibold text-white shadow-lg shadow-pink-200 transition hover:-translate-y-0.5 hover:bg-[#8e2f5e] ${ring}`}>Explore Collection</Link><Link href="/track-order" className={`inline-flex min-h-12 items-center rounded-full border border-[#a83c70] bg-white px-8 text-sm font-semibold text-[#a83c70] transition hover:bg-pink-50 ${ring}`}>Track Your Order</Link></div>
      <ul className="mx-auto mt-8 grid max-w-lg grid-cols-2 gap-x-4 gap-y-3 text-left">{trust.map(({ i: I, t }) => <li key={t} className="flex items-center gap-2.5 text-xs font-medium text-[#4a2b3c]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pink-50 text-[#a83c70]"><I size={17} /></span>{t}</li>)}</ul>
    </div></div></section>

    {catTiles.length >= 2 && <section className="mx-auto max-w-7xl px-5 py-14"><Eyebrow label="Shop by Category" title="Find your style" /><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{catTiles.map(c => <button key={c.name} onClick={() => goShop(c.name)} className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-100 to-[#fff5f8] text-left ${ring}`}>{c.image ? <img src={c.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <span className="absolute inset-0 grid place-items-center font-serif text-6xl text-pink-300">{c.name.charAt(0)}</span>}<span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 text-sm font-semibold text-white">{c.name}</span></button>)}</div></section>}

    {featured.length > 0 && <section className="mx-auto max-w-7xl px-5 py-14"><Eyebrow label="Featured" title="Our favourites right now" /><div className="no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-7 lg:overflow-visible lg:px-0">{featured.slice(0, 8).map(p => <div key={p.id} className="w-44 shrink-0 snap-start sm:w-56 lg:w-auto"><ProductCard p={p} onAdd={add} hideAdd wished={wish.includes(p.id)} onWish={toggleWish} /></div>)}</div></section>}

    <section id="shop" className="mx-auto max-w-7xl px-5 py-16"><Eyebrow label="The Collection" title="Find your favourite" sub="A lovely little something is waiting for you." />
      <div className="mb-6 space-y-3"><div className="flex flex-col gap-3 sm:flex-row"><label className="flex min-h-11 flex-1 items-center gap-2 rounded-full border border-pink-200 bg-white px-4 focus-within:ring-2 focus-within:ring-[#a83c70]"><Search size={17} className="text-[#a83c70]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." aria-label="Search products" className="w-full bg-transparent text-sm outline-none" /></label>
        <div className="sm:w-56"><Dropdown<Sort> ariaLabel="Sort products" label="Sort:" value={sort} onChange={setSort} options={[{ value: 'featured', label: 'Featured' }, { value: 'low', label: 'Price: Low to High' }, { value: 'high', label: 'Price: High to Low' }, { value: 'newest', label: 'Newest' }, { value: 'rated', label: 'Top Rated' }]} /></div></div>
        {categories.length > 0 && <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Categories">{['All', ...categories].map(c => <button key={c} onClick={() => pickCategory(c)} aria-pressed={category === c} className={chip(category === c)}>{c}</button>)}</div>}
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Price range">{PRICE_RANGES.map((r, i) => <button key={r.label} onClick={() => setRange(i)} aria-pressed={range === i} className={chip(range === i)}>{r.label}</button>)}</div></div>
      {!loading && !error && products.length > 0 && <p className="mb-4 text-xs text-[#6b5360]">Showing {shown.length} product{shown.length === 1 ? '' : 's'}</p>}
      {loading ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-7" aria-busy="true">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="overflow-hidden rounded-2xl border border-pink-100 bg-white"><div className="da-skeleton aspect-[4/5]" /><div className="space-y-2 p-4"><div className="da-skeleton h-3 w-1/3 rounded" /><div className="da-skeleton h-4 w-4/5 rounded" /><div className="da-skeleton h-4 w-1/2 rounded" /></div></div>)}</div>
        : error ? <div className="rounded-2xl border border-pink-200 bg-white p-8 text-center text-sm text-[#6b5360]">We could not load the collection right now.<p className="mt-2 text-xs">{error}</p><button onClick={() => location.reload()} className={`mt-4 min-h-11 rounded-full bg-[#a83c70] px-6 text-sm font-semibold text-white ${ring}`}>Try again</button></div>
        : products.length === 0 ? <div className="rounded-2xl border border-pink-100 bg-white p-10 text-center"><Sparkles className="mx-auto text-[#a83c70]" /><p className="mt-3 font-serif text-2xl">New pieces are on their way</p><p className="mt-1 text-sm text-[#6b5360]">Please check back soon.</p></div>
        : shown.length === 0 ? <div className="rounded-2xl border border-pink-100 bg-white p-10 text-center"><SearchX className="mx-auto text-[#a83c70]" /><p className="mt-3 font-serif text-2xl">Nothing matched</p><p className="mt-1 text-sm text-[#6b5360]">Try clearing filters.</p><button onClick={clear} className={`mt-5 min-h-11 rounded-full bg-[#a83c70] px-6 text-sm font-semibold text-white ${ring}`}>Clear filters</button></div>
        : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-7">{shown.map(p => <ProductCard key={p.id} p={p} onAdd={add} hideAdd wished={wish.includes(p.id)} onWish={toggleWish} />)}</div>}
      {filtersActive && !loading && shown.length > 0 && <div className="mt-6 text-center"><button onClick={clear} className="text-xs text-[#a83c70] underline">Clear filters</button></div>}
    </section>

    <section id="why-us" className="bg-[#f9e7ef] px-5 py-16"><div className="mx-auto max-w-7xl"><Eyebrow label="Why Sparkles" title="Made to feel special" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{usps.map(({ i: I, t, d }) => <div key={t} className="rounded-2xl bg-white p-6 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-pink-50 text-[#a83c70]"><I size={22} /></span><h3 className="mt-4 text-sm font-semibold">{t}</h3><p className="mt-1.5 text-sm leading-6 text-[#6b5360]">{d}</p></div>)}</div>
      <div className="mx-auto mt-12 max-w-xl text-center"><p className="text-xs font-semibold uppercase tracking-[.25em] text-[#a83c70]">A note from us</p><p className="mt-4 text-sm leading-7 text-[#5f4857]">Har product hum khud pasand karke, check karke aur pyar se pack karke bhejte hain. Aap ka bharosa hi hamari dukaan hai — is liye har order ki confirmation aur tracking aap ko WhatsApp par milti hai.</p><p className="mt-3 font-serif text-base italic text-[#a83c70]">— Team Sparklesbyfarry</p></div></div></section>

    {reviews.length > 0 && <section className="mx-auto max-w-7xl px-5 py-16"><Eyebrow label="Customer Love" title="Kind words from our customers" /><div className="no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">{reviews.slice(0, 6).map(r => <figure key={r.id} className="w-72 shrink-0 snap-start rounded-2xl border border-pink-100 bg-white p-6 md:w-auto"><Stars value={r.rating} size={16} />{r.title && <p className="mt-3 font-semibold">{r.title}</p>}<blockquote className="mt-2 text-sm leading-6 text-[#5f4857]">{r.excerpt}</blockquote><figcaption className="mt-4 text-sm font-medium">{r.name}{r.product && <span className="block text-xs font-normal text-[#6b5360]">{r.product}</span>}<span className="mt-2 inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#a83c70]"><BadgeCheck size={12} /> Verified Buyer</span></figcaption></figure>)}</div></section>}

    <section id="faq" className="mx-auto max-w-3xl px-5 py-16"><Eyebrow label="Good to know" title="Frequently asked questions" />{settings ? <Accordion items={faqItems(fee)} /> : <div className="da-skeleton h-48 rounded-2xl" aria-hidden="true" />}</section>

    <section className="px-5 pb-16"><div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-[#f9dce9] to-[#fff1f6] px-6 py-14 text-center"><h2 className="font-serif text-3xl text-[#4a2b3c] md:text-4xl">Make ordinary days feel lovely.</h2><button onClick={() => goShop()} className={`mt-6 min-h-12 rounded-full bg-[#a83c70] px-8 text-sm font-semibold text-white hover:bg-[#8e2f5e] ${ring}`}>Shop the Collection</button></div></section>

    <footer className="bg-[#382431] px-5 py-12 text-white"><div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
      <div><div className="flex items-center gap-3"><img src="/logo.jpg" alt="Sparklesbyfarry logo" className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/30" /><p className="font-serif text-2xl">Sparklesbyfarry</p></div><p className="mt-2 text-sm text-pink-100/80">Sparkle. Shine. Inspire.</p><div className="mt-4 flex gap-2">{settings?.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"><Instagram size={18} /></a>}{settings?.facebook && <a href={settings.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"><Facebook size={18} /></a>}{wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"><MessageCircle size={18} /></a>}</div></div>
      <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-pink-200">Shop</p><ul className="mt-4 space-y-1 text-sm text-pink-100/85">{categories.slice(0, 6).map(c => <li key={c}><button onClick={() => goShop(c)} className="min-h-9 hover:text-white">{c}</button></li>)}<li><button onClick={() => goShop('All')} className="min-h-9 hover:text-white">All products</button></li></ul></div>
      <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-pink-200">Help</p><ul className="mt-4 space-y-1 text-sm text-pink-100/85"><li><Link href="/track-order" className="inline-block min-h-9 py-1.5 hover:text-white">Track Order</Link></li><li><a href="#faq" className="inline-block min-h-9 py-1.5 hover:text-white">FAQ</a></li><li><a href="#faq" className="inline-block min-h-9 py-1.5 hover:text-white">Shipping &amp; Exchange</a></li></ul></div>
      <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-pink-200">Contact</p><div className="mt-4 space-y-1 text-sm text-pink-100/85">{wa ? <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp: +{wa}</a> : <p>Message us on WhatsApp after you order.</p>}<p>Support for orders and exchange enquiries.</p></div></div>
    </div><div className="mx-auto mt-10 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-[11px] text-pink-100/70 sm:flex-row"><p>© {new Date().getFullYear()} Sparklesbyfarry. All rights reserved.</p><p className="flex items-center gap-2">Advance payment via <span className="rounded border border-white/20 px-2 py-0.5">Easypaisa</span><span className="rounded border border-white/20 px-2 py-0.5">JazzCash</span></p></div></footer>

    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-pink-100 bg-white/95 backdrop-blur md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {[{ h: '/', l: 'Home', I: Sparkles }, { h: '/products', l: 'Products', I: Search }, { h: '/track-order', l: 'Track', I: Truck }].map(({ h, l, I }) => h.startsWith('/') ? <Link key={l} href={h} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-[#4a2b3c]"><I size={19} />{l}</Link> : <a key={l} href={h} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-[#4a2b3c]"><I size={19} />{l}</a>)}
      <button onClick={() => { setCartOpen(true); setToast(false); }} className="relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-[#a83c70]" aria-label={`Open bag, ${count} items`}><ShoppingBag size={19} />Bag{count > 0 && <span className="absolute right-[28%] top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#a83c70] px-1 text-[9px] text-white">{count}</span>}</button></nav>
    {toast && <button onClick={() => { setToast(false); setCartOpen(true); }} className="da-toast fixed inset-x-4 bottom-20 z-40 flex min-h-12 items-center justify-between gap-3 rounded-full bg-[#352331] px-5 text-sm text-white shadow-xl" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}><span className="flex min-w-0 items-center gap-2"><CheckCircle2 size={18} className="shrink-0 text-green-400" /><span className="truncate">{toastName} added to your bag</span></span><span className="shrink-0 font-semibold text-pink-200">View Bag</span></button>}

    {cartOpen && <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setCartOpen(false)}><aside role="dialog" aria-modal="true" aria-label="Your bag" className="da-drawer flex h-full w-full max-w-md flex-col bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-pink-100 p-5"><h3 className="font-serif text-2xl">Your Bag</h3><button onClick={() => setCartOpen(false)} aria-label="Close bag" className={`grid h-11 w-11 place-items-center rounded-full hover:bg-pink-50 ${ring}`}><X size={20} /></button></div>
      {cart.length === 0 ? <div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><ShoppingBag size={44} className="text-pink-300" /><p className="mt-4 font-serif text-2xl">Your bag is feeling light</p><button onClick={() => { setCartOpen(false); goShop(); }} className={`mt-6 min-h-12 rounded-full bg-[#a83c70] px-8 text-sm font-semibold text-white ${ring}`}>Start Shopping</button></div>
        : <><div className="flex-1 space-y-4 overflow-y-auto p-5">{cart.map(item => { const sv = item.originalPrice && item.originalPrice > item.price ? item.originalPrice - item.price : 0; return <div key={lineKey(item)} className={`flex items-center gap-3 border-b border-pink-100 pb-4 transition-all duration-200 ${removing === lineKey(item) ? 'translate-x-full opacity-0' : ''}`}>
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-pink-50">{item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center font-serif text-2xl text-pink-300">{item.name.charAt(0)}</span>}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.name}</p>{item.variant && <p className="text-xs text-[#6b5360]">Shade: {item.variant}</p>}<p className="text-xs text-[#a83c70]">{money(item.price)}{sv > 0 && <><span className="ml-2 text-gray-400 line-through">{money(item.originalPrice as number)}</span><span className="ml-2 text-[#6b5360]">Save {money(sv)}</span></>}</p>
            <div className="mt-2 flex items-center gap-1"><button onClick={() => setQty(lineKey(item), -1)} disabled={item.quantity <= 1} aria-label={`Decrease ${item.name}`} className={`grid h-11 w-11 place-items-center rounded-full border border-pink-200 disabled:opacity-40 ${ring}`}><Minus size={14} /></button><span className="w-6 text-center text-sm" aria-live="polite">{item.quantity}</span><button onClick={() => setQty(lineKey(item), 1)} disabled={item.quantity >= cap(item.stock)} aria-label={`Increase ${item.name}`} className={`grid h-11 w-11 place-items-center rounded-full border border-pink-200 disabled:opacity-40 ${ring}`}><Plus size={14} /></button>
              <button onClick={() => remove(lineKey(item))} aria-label={`Remove ${item.name}`} className={`ml-auto grid h-11 w-11 place-items-center rounded-full text-gray-500 hover:text-red-600 ${ring}`}><X size={18} /></button></div>{item.quantity >= cap(item.stock) && <p className="mt-1 text-[11px] text-[#6b5360]">Only {cap(item.stock)} available</p>}</div></div>; })}
          <p className="text-xs text-[#6b5360]">{fee ? `Delivery (flat ${money(fee)})` : 'Delivery'} is added at checkout.</p></div>
        <div className="border-t border-pink-100 p-5" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}><div className="flex justify-between text-sm"><span>Subtotal</span><b className="text-lg text-[#a83c70]">{money(subtotal)}</b></div><Link href="/checkout" className={`mt-4 flex min-h-12 items-center justify-center rounded-full bg-[#a83c70] px-6 text-sm font-semibold text-white hover:bg-[#8e2f5e] ${ring}`}>Checkout</Link><p className="mt-3 text-center text-[11px] text-[#6b5360]">Secure advance payment · Easypaisa &amp; JazzCash</p></div></>}
    </aside></div>}
    <WhatsAppFab />
  </main>;
}
