'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Heart, ShoppingBag, X, Minus, Plus, Trash2 } from 'lucide-react';
import ProductCard, { type Product } from '@/components/product-card';
import AddedOverlay, { type AddedItem } from '@/components/added-overlay';
import { trackEvent } from '@/components/analytics-tracker';
import { money, effectivePrice, isOnSale, discountPercent, isPurchasable } from '@/lib/format';

type Line = { id: string; name: string; price: number; originalPrice?: number; image: string; quantity: number; stock: number };
const ring = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a83c70] focus-visible:ring-offset-2';
const firstImg = (p: Product) => [...(p.product_images || [])].sort((a, b) => a.display_order - b.display_order)[0]?.image_url || '';

export default function ProductsPage() {
  const params = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(() => (params.get('wishlist') ? 'Wishlist' : 'All'));
  const [sort, setSort] = useState('featured');
  const [wish, setWish] = useState<string[]>([]);
  const [cart, setCart] = useState<Line[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [addedItem, setAddedItem] = useState<AddedItem | null>(null);

  useEffect(() => {
    fetch('/api/products').then(r => (r.ok ? r.json() : null)).then(d => { if (d) setProducts(d.products || []); }).catch(() => {}).finally(() => setLoading(false));
    try { setWish(JSON.parse(localStorage.getItem('da-wishlist') || '[]')); } catch { /* ignore */ }
    try { setCart(JSON.parse(localStorage.getItem('da-cart') || '[]')); } catch { /* ignore */ }
  }, []);

  const categories = useMemo(() => [...new Set(products.map(p => p.categories?.name).filter(Boolean))] as string[], [products]);
  const count = cart.reduce((s, x) => s + x.quantity, 0);
  const subtotal = cart.reduce((s, x) => s + x.price * x.quantity, 0);

  const shown = useMemo(() => {
    let list = products.filter(p => (category === 'All' ? true : category === 'Wishlist' ? wish.includes(p.id) : p.categories?.name === category) && (!query || p.name.toLowerCase().includes(query.toLowerCase())));
    const by: Record<string, (a: Product, b: Product) => number> = {
      featured: (a, b) => Number(b.is_featured) - Number(a.is_featured),
      'price-asc': (a, b) => effectivePrice(a) - effectivePrice(b),
      'price-desc': (a, b) => effectivePrice(b) - effectivePrice(a),
      rating: (a, b) => (b.rating_average || 0) - (a.rating_average || 0) || (b.rating_count || 0) - (a.rating_count || 0),
      saving: (a, b) => discountPercent(b) - discountPercent(a)
    };
    return [...list].sort(by[sort] || by.featured);
  }, [products, category, query, sort, wish]);

  function saveCart(next: Line[]) { setCart(next); try { localStorage.setItem('da-cart', JSON.stringify(next)); } catch { /* ignore */ } }
  function add(p: Product) {
    if (!isPurchasable(p)) return;
    const line: Line = { id: p.id, name: p.name, price: effectivePrice(p), originalPrice: isOnSale(p) ? p.price : undefined, image: firstImg(p), quantity: 1, stock: p.stock_quantity };
    const old = cart.find(x => x.id === p.id);
    if (old) saveCart(cart.map(x => (x.id === p.id ? { ...x, quantity: Math.min(Math.min(20, p.stock_quantity), x.quantity + 1), stock: p.stock_quantity } : x)));
    else saveCart([...cart, line]);
    trackEvent('add_to_cart', { productId: p.id });
    setAddedItem({ name: p.name, image: line.image });
  }
  const setQty = (id: string, qty: number) => saveCart(cart.map(x => (x.id === id ? { ...x, quantity: Math.max(1, Math.min(Math.min(20, x.stock), qty)) } : x)));
  const removeLine = (id: string) => saveCart(cart.filter(x => x.id !== id));
  const toggleWish = (id: string) => setWish(w => { const n = w.includes(id) ? w.filter(x => x !== id) : [...w, id]; if (!w.includes(id)) trackEvent('wishlist_add', { productId: id }); try { localStorage.setItem('da-wishlist', JSON.stringify(n)); } catch { /* ignore */ } return n; });

  return <main className="min-h-screen bg-[#fff9fc] text-[#352331]">
    <header className="sticky top-0 z-40 border-b border-pink-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5"><img src="/logo.jpg" alt="Sparklesbyfarry logo" className="h-10 w-10 rounded-xl object-cover ring-1 ring-pink-200" /><span className="font-serif text-xl font-bold tracking-tight text-[#a83c70]">Sparkles<span className="text-[#352331]">byfarry</span></span></Link>
        <nav className="ml-auto flex items-center gap-5 text-sm">
          <Link href="/" className="hidden hover:text-[#a83c70] sm:inline">Home</Link>
          <Link href="/track-order" className="hidden hover:text-[#a83c70] sm:inline">Track Order</Link>
          <button type="button" onClick={() => setCartOpen(true)} aria-label={`Open bag, ${count} items`} className={`relative grid h-11 w-11 place-items-center rounded-full bg-pink-50 text-[#a83c70] ${ring}`}><ShoppingBag size={19} />{count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#a83c70] px-1 text-[10px] font-bold text-white">{count}</span>}</button>
        </nav>
      </div>
    </header>

    <section className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-xs font-semibold uppercase tracking-[.25em] text-[#a83c70]">The Collection</p>
      <h1 className="mt-2 font-serif text-4xl">All Products</h1>
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="flex min-h-12 flex-1 items-center gap-2 rounded-full border border-pink-200 bg-white px-4"><Search size={17} className="shrink-0 text-[#a83c70]" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products…" aria-label="Search products" className="w-full bg-transparent text-sm outline-none" /></label>
        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0" role="group" aria-label="Filter by category">
          {['All', ...categories, 'Wishlist'].map(c => <button key={c} onClick={() => setCategory(c)} aria-pressed={category === c} className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs font-semibold transition ${category === c ? 'bg-[#a83c70] text-white' : 'border border-pink-200 bg-white text-[#6b5360] hover:border-[#a83c70]'} ${ring}`}>{c === 'Wishlist' && <Heart size={13} />}{c}</button>)}
        </div>
        <label className="flex min-h-12 items-center gap-2 text-sm">Sort
          <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort products" className={`min-h-12 rounded-full border border-pink-200 bg-white px-3 text-sm ${ring}`}>
            <option value="featured">Featured</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="rating">Top Rated</option><option value="saving">Biggest Saving</option>
          </select></label>
      </div>
      <p className="mt-4 text-xs text-[#6b5360]" aria-live="polite">{loading ? 'Loading products…' : `${shown.length} product${shown.length === 1 ? '' : 's'}`}</p>
      {loading
        ? <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-7">{[1, 2, 3, 4].map(i => <div key={i} className="da-skeleton aspect-[4/5] rounded-2xl" />)}</div>
        : shown.length === 0
          ? <div className="mt-5 rounded-3xl border border-dashed border-pink-200 bg-white px-6 py-16 text-center"><p className="font-serif text-2xl">{category === 'Wishlist' ? 'Your wishlist is empty' : 'No products found'}</p><p className="mx-auto mt-2 max-w-sm text-sm text-[#6b5360]">{category === 'Wishlist' ? 'Tap the heart on any product to save it here.' : 'Try a different search or category.'}</p>{category !== 'All' && <button onClick={() => { setCategory('All'); setQuery(''); }} className={`mt-5 min-h-11 rounded-full bg-[#a83c70] px-6 text-sm font-semibold text-white ${ring}`}>View all products</button>}</div>
          : <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-7">{shown.map(p => <ProductCard key={p.id} p={p} onAdd={add} wished={wish.includes(p.id)} onWish={toggleWish} />)}</div>}
    </section>

    <footer className="border-t border-pink-100 px-5 py-8 text-center text-xs text-[#6b5360]">© {new Date().getFullYear()} Sparklesbyfarry · Sparkle. Shine. Inspire.</footer>

    <AddedOverlay item={addedItem} onClose={() => setAddedItem(null)} onViewCart={() => { setAddedItem(null); setCartOpen(true); }} />

    {cartOpen && <div className="fixed inset-0 z-[90] flex justify-end bg-black/45" onClick={() => setCartOpen(false)}>
      <aside className="da-drawer flex h-full w-full max-w-md flex-col bg-white shadow-2xl" onClick={e => e.stopPropagation()} aria-label="Shopping bag">
        <div className="flex items-center justify-between border-b border-pink-100 p-5"><h2 className="font-serif text-2xl">Your Bag</h2><button type="button" onClick={() => setCartOpen(false)} aria-label="Close bag" className={`grid h-11 w-11 place-items-center rounded-full hover:bg-pink-50 ${ring}`}><X size={20} /></button></div>
        {cart.length === 0
          ? <div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><ShoppingBag size={44} className="text-pink-300" /><p className="mt-4 font-serif text-xl">Your bag is empty</p><button type="button" onClick={() => setCartOpen(false)} className={`mt-5 min-h-11 rounded-full bg-[#a83c70] px-6 text-sm font-semibold text-white ${ring}`}>Start shopping</button></div>
          : <><ul className="flex-1 divide-y divide-pink-50 overflow-y-auto p-5">{cart.map(x => <li key={x.id} className="flex gap-3 py-4">
              <span className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-pink-50">{x.image && <img src={x.image} alt="" className="h-full w-full object-cover" />}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{x.name}</span><span className="mt-0.5 block text-sm font-semibold text-[#a83c70]">{money(x.price)}</span>
                <span className="mt-2 flex items-center gap-2">
                  <button type="button" onClick={() => setQty(x.id, x.quantity - 1)} disabled={x.quantity <= 1} aria-label="Decrease quantity" className="grid h-9 w-9 place-items-center rounded-full border border-pink-200 disabled:opacity-40"><Minus size={14} /></button>
                  <span className="min-w-6 text-center text-sm font-semibold">{x.quantity}</span>
                  <button type="button" onClick={() => setQty(x.id, x.quantity + 1)} disabled={x.quantity >= Math.min(20, x.stock)} aria-label="Increase quantity" className="grid h-9 w-9 place-items-center rounded-full border border-pink-200 disabled:opacity-40"><Plus size={14} /></button>
                  <button type="button" onClick={() => removeLine(x.id)} aria-label={`Remove ${x.name}`} className="ml-auto grid h-9 w-9 place-items-center rounded-full text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                </span></span>
              <span className="text-sm font-semibold">{money(x.price * x.quantity)}</span></li>)}</ul>
            <div className="border-t border-pink-100 p-5"><div className="flex justify-between text-sm"><span>Subtotal</span><b>{money(subtotal)}</b></div><p className="mt-1 text-xs text-[#6b5360]">Delivery is added at checkout.</p><Link href="/checkout" className="mt-4 flex min-h-12 items-center justify-center rounded-full bg-[#a83c70] px-6 text-sm font-bold text-white shadow-lg shadow-pink-200">Checkout</Link></div></>}
      </aside>
    </div>}
  </main>;
}
