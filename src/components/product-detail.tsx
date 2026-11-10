'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/components/analytics-tracker';
import ProductCard, { type Product } from '@/components/product-card';
import AddedOverlay, { type AddedItem } from '@/components/added-overlay';
import { Accordion, Stars } from '@/components/ui';
import WhatsAppFab from '@/components/whatsapp-fab';
import { productInfo } from '@/lib/content/product-info';
import { money, effectivePrice, isOnSale, savings, isPurchasable } from '@/lib/format';
import { Gem, ShieldCheck, MessageCircle, Link2, Share2, BadgeCheck, ChevronRight, CheckCircle2, X } from 'lucide-react';

type Detail = { id: string; name: string; slug: string; description: string | null; price: number; sale_price: number | null; stock_quantity: number; category: string | null; images: { image_url: string; alt_text: string | null }[]; rating: { count: number; average: number; breakdown: number[] }; reviews: { id: string; customer_name: string; rating: number; review_title: string | null; review_text: string | null; created_at: string }[]; similar: Product[]; recommended: Product[] };
const ring = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a83c70] focus-visible:ring-offset-2';
const shortName = (n: string) => { const p = n.trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length - 1].charAt(0)}.` : (p[0] || n); };

export default function ProductDetail({ product, deliveryFee, supportNumber }: { product: Detail; deliveryFee: number; supportNumber: string }) {
  const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false); const [rating, setRating] = useState(5); const [form, setForm] = useState({ orderNumber: '', phone: '', title: '', text: '' });
  const [reviewMsg, setReviewMsg] = useState(''); const [reviewOk, setReviewOk] = useState(false); const [showForm, setShowForm] = useState(false); const [addedItem, setAddedItem] = useState<AddedItem | null>(null);
  const [active, setActive] = useState(0); const [fade, setFade] = useState(false); const [showBar, setShowBar] = useState(false); const [wish, setWish] = useState<string[]>([]); const [copied, setCopied] = useState(false);
  const buyRef = useRef<HTMLButtonElement>(null); const [recent, setRecent] = useState<Product[]>([]); const [pageUrl, setPageUrl] = useState('');
  const buyable = isPurchasable(product); const sale = isOnSale(product) && buyable; const price = effectivePrice(product);
  const imgs = product.images.filter(im => im.image_url); const main = imgs[active];
  const info = productInfo(deliveryFee);
  useEffect(() => { setPageUrl(window.location.href); }, []);
  useEffect(() => {
    try { const ids: string[] = JSON.parse(localStorage.getItem('da-recent') || '[]'); const others = ids.filter(x => x !== product.id);
      localStorage.setItem('da-recent', JSON.stringify([product.id, ...others].slice(0, 10)));
      if (others.length) fetch('/api/products').then(r => r.ok ? r.json() : null).then(d => d && setRecent(others.map(id => (d.products as Product[]).find(p => p.id === id)).filter(Boolean).slice(0, 4) as Product[])).catch(() => {}); } catch { /* storage unavailable */ }
  }, [product.id]);
  useEffect(() => { try { setWish(JSON.parse(localStorage.getItem('da-wishlist') || '[]')); } catch {} }, []);
  useEffect(() => {
    const el = buyRef.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 }); io.observe(el); return () => io.disconnect();
  }, []);
  function pick(i: number) { if (i === active) return; setFade(true); setTimeout(() => { setActive(i); setFade(false); }, 150); }
  function write(p: { id: string; name: string; price: number; originalPrice?: number; image: string; stock: number }) {
    try { const cart = JSON.parse(localStorage.getItem('da-cart') || '[]'); const old = cart.find((x: { id: string }) => x.id === p.id);
      if (old) { old.quantity = Math.min(Math.min(20, p.stock), old.quantity + 1); old.stock = p.stock; } else cart.push({ id: p.id, name: p.name, price: p.price, originalPrice: p.originalPrice, image: p.image, quantity: 1, stock: p.stock });
      localStorage.setItem('da-cart', JSON.stringify(cart)); trackEvent('add_to_cart', { productId: p.id }); setNotice(''); setAddedItem({ name: p.name, image: p.image }); } catch { setNotice('Could not update your bag.'); }
  }
  const add = () => buyable && write({ id: product.id, name: product.name, price, originalPrice: isOnSale(product) ? product.price : undefined, image: imgs[0]?.image_url || '', stock: product.stock_quantity });
  const addRelated = (p: Product) => { if (!isPurchasable(p)) return; write({ id: p.id, name: p.name, price: effectivePrice(p), originalPrice: isOnSale(p) ? p.price : undefined, image: [...(p.product_images || [])].sort((a, b) => a.display_order - b.display_order)[0]?.image_url || '', stock: p.stock_quantity }); };
  const toggleWish = (id: string) => setWish(w => { const n = w.includes(id) ? w.filter(x => x !== id) : [...w, id]; if (!w.includes(id)) trackEvent('wishlist_add', { productId: id }); try { localStorage.setItem('da-wishlist', JSON.stringify(n)); } catch {} return n; });
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setReviewMsg(''); try { const r = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id, orderNumber: form.orderNumber, phone: form.phone, rating, title: form.title, text: form.text }) }); const j = await r.json(); if (!r.ok) throw Error(j.error); setReviewOk(true); setReviewMsg('Thank you! Your review has been submitted. It will appear on this page after the store approves it.'); setForm({ orderNumber: '', phone: '', title: '', text: '' }); } catch (err) { setReviewOk(false); setReviewMsg(err instanceof Error ? err.message : 'Review could not be submitted.'); } finally { setBusy(false); } }
  async function share(kind: 'wa' | 'copy') {
    const url = window.location.href;
    if (kind === 'wa') { window.open(`https://wa.me/?text=${encodeURIComponent(`${product.name} — ${money(price)}\n${url}`)}`, '_blank', 'noopener'); return; }
    try { if (navigator.share) { await navigator.share({ title: product.name, url }); return; } } catch { /* fall through to clipboard */ }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setNotice('Could not copy the link.'); }
  }
  const trust = [{ i: Gem, t: 'Premium Quality Checked' }, { i: ShieldCheck, t: 'Secure Advance Payment' }, { i: MessageCircle, t: 'WhatsApp Order Support' }];
  const accItems = [{ q: 'Product Details', a: product.description || 'A lovely addition to your everyday style.' }, ...info.map(i => ({ q: i.title, a: i.body }))];
  const r = product.rating;

  return <main className="min-h-screen bg-[#fff9fc] px-5 py-8 pb-28 text-[#352331] md:pb-10"><div className="mx-auto max-w-6xl">
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-[#6b5360]"><Link href="/" className="hover:text-[#a83c70]">Home</Link><ChevronRight size={12} />{product.category && <><Link href="/#shop" className="hover:text-[#a83c70]">{product.category}</Link><ChevronRight size={12} /></>}<span className="text-[#352331]">{product.name}</span></nav>
    <div className="mt-6 grid gap-10 md:grid-cols-2">
      <div className="md:flex md:gap-3">
        {imgs.length > 1 && <div className="order-2 mt-3 flex gap-2 overflow-x-auto md:order-1 md:mt-0 md:flex-col md:overflow-visible" role="group" aria-label="Product images">{imgs.map((im, i) => <button key={i} onClick={() => pick(i)} aria-label={`Show image ${i + 1}`} aria-pressed={i === active} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === active ? 'border-[#a83c70]' : 'border-transparent'} ${ring}`}><img src={im.image_url} alt="" className="h-full w-full object-cover" /></button>)}</div>}
        <div className={`order-1 flex-1 overflow-hidden rounded-3xl bg-pink-50 ${!buyable ? 'opacity-90' : ''}`}>{main?.image_url ? <img src={main.image_url} alt={main.alt_text || product.name} className={`aspect-[4/5] w-full object-cover transition-opacity duration-150 ${fade ? 'opacity-0' : 'opacity-100'}`} /> : <div className="grid aspect-[4/5] place-items-center font-serif text-8xl text-pink-300">{product.name.charAt(0)}</div>}</div>
      </div>
      <section className="py-2"><p className="text-xs uppercase tracking-[.2em] text-[#a83c70]">Sparklesbyfarry</p><h1 className="mt-3 font-serif text-3xl md:text-4xl">{product.name}</h1>
        <button type="button" onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })} className={`mt-3 flex items-center gap-2 text-sm text-[#6b5360] ${ring}`}><Stars value={r.average} size={16} />{r.count > 0 ? <><span>{r.average.toFixed(1)}</span><span className="underline">({r.count} review{r.count === 1 ? '' : 's'}) — tap to read &amp; write</span></> : <span className="underline">No reviews yet — tap to write one</span>}</button>
        <p className="mt-5 flex flex-wrap items-baseline gap-x-3 text-2xl font-bold text-[#a83c70]">{money(price)}{sale && <><del className="text-base font-normal text-gray-400">{money(product.price)}</del><span className="rounded-full bg-[#a83c70] px-2.5 py-1 text-[11px] font-bold uppercase text-white">Save {money(savings(product))}</span></>}</p>
        <p className="mt-4 text-sm">{buyable ? (product.stock_quantity <= 10 ? `Only ${product.stock_quantity} left` : 'In stock') : 'Currently sold out'}</p>
        <button ref={buyRef} disabled={!buyable} onClick={add} className={`mt-6 min-h-12 w-full rounded-full bg-[#a83c70] px-8 text-sm font-semibold text-white transition hover:bg-[#8e2f5e] disabled:bg-gray-300 disabled:text-gray-500 sm:w-auto ${ring}`}>{buyable ? 'Add to Bag' : 'Sold Out'}</button>
        {notice && <p role="status" className="mt-4 rounded-xl bg-pink-50 p-3 text-sm text-[#8e2f5e]">{notice}{notice === 'Added to your bag.' && <> <Link href="/checkout" className="font-semibold underline">Checkout</Link></>}</p>}
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">{trust.map(({ i: I, t }) => <li key={t} className="flex items-center gap-2 rounded-2xl border border-pink-100 bg-white p-3 text-xs font-medium"><I size={18} className="shrink-0 text-[#a83c70]" />{t}</li>)}</ul>
        <div className="mt-6"><Accordion items={accItems} /></div>
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm"><span className="mr-1 flex items-center gap-1 text-[#6b5360]"><Share2 size={15} /> Share</span><button onClick={() => share('wa')} className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border border-pink-200 bg-white px-4 text-xs font-medium ${ring}`}><MessageCircle size={14} /> WhatsApp</button><button onClick={() => share('copy')} className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border border-pink-200 bg-white px-4 text-xs font-medium ${ring}`}><Link2 size={14} /> {copied ? 'Link copied' : 'Copy link'}</button>
          {supportNumber && <a href={`https://wa.me/${supportNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-[#a83c70] underline">Ask on WhatsApp</a>}</div>
      </section></div>

    {product.similar.length > 0 && <section className="mt-16"><h2 className="font-serif text-3xl">Similar Products</h2><div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">{product.similar.map(p => <ProductCard key={p.id} p={p} onAdd={addRelated} wished={wish.includes(p.id)} onWish={toggleWish} />)}</div></section>}
    {product.recommended.length > 0 && <section className="mt-16"><h2 className="font-serif text-3xl">Recommended For You</h2><div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">{product.recommended.map(p => <ProductCard key={p.id} p={p} onAdd={addRelated} wished={wish.includes(p.id)} onWish={toggleWish} />)}</div></section>}
    <section id="reviews" className="mt-16"><h2 className="font-serif text-3xl">Ratings &amp; reviews</h2><div className="mt-6 grid gap-8 lg:grid-cols-[300px_1fr]"><div>{r.count > 0 && <div className="rounded-2xl border border-pink-100 bg-white p-5"><div className="flex items-center gap-3"><span className="font-serif text-4xl">{r.average.toFixed(1)}</span><div><Stars value={r.average} size={16} /><p className="text-xs text-[#6b5360]">{r.count} review{r.count === 1 ? '' : 's'}</p></div></div><div className="mt-4 space-y-1.5">{[5, 4, 3, 2, 1].map(n => { const pct = Math.round(((r.breakdown[n] || 0) / r.count) * 100); return <div key={n} className="flex items-center gap-2 text-xs"><span className="w-6">{n}★</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-pink-100"><div className="h-full rounded-full bg-[#a83c70]" style={{ width: `${pct}%` }} /></div><span className="w-9 text-right text-[#6b5360]">{pct}%</span></div>; })}</div></div>}{r.count === 0 && <div className="rounded-2xl border border-pink-100 bg-white p-5"><Stars value={0} size={16} /><p className="mt-2 text-sm text-[#6b5360]">No ratings yet - be the first to review this product.</p></div>}</div><div>{product.reviews.length ? <div className="flex snap-x gap-4 overflow-x-auto pb-2">{product.reviews.map(x => <article key={x.id} className="w-[270px] shrink-0 snap-start rounded-2xl border border-pink-100 bg-white p-5"><div className="flex items-center justify-between gap-2"><Stars value={x.rating} size={15} /><span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#a83c70]"><BadgeCheck size={12} /> Verified</span></div>{x.review_title && <h3 className="mt-2 font-semibold">{x.review_title}</h3>}<p className="mt-2 text-sm text-[#5f4857]">{x.review_text}</p><p className="mt-3 text-xs text-[#6b5360]">{shortName(x.customer_name)} · {new Date(x.created_at).toLocaleDateString('en-GB')}</p></article>)}</div> : <p className="mt-4 text-sm text-[#6b5360]">No approved reviews yet.</p>}<button type="button" onClick={() => setShowForm(!showForm)} aria-expanded={showForm} className={`mt-5 inline-flex min-h-11 items-center rounded-full border border-[#a83c70] bg-white px-6 text-sm font-semibold text-[#a83c70] ${ring}`}>{showForm ? 'Close the form' : 'Write a review'}</button>{showForm && <form onSubmit={submit} className="mt-5 rounded-2xl border border-pink-100 bg-white p-6"><h2 className="font-serif text-2xl">Write a review</h2><p className="mt-2 text-xs text-[#6b5360]">Verified purchase required. Enter your order number and checkout phone.</p>
        <label className="mt-4 block text-sm">Order number<input required value={form.orderNumber} onChange={e => setForm({ ...form, orderNumber: e.target.value })} className={`mt-1 w-full rounded-xl border p-3 ${ring}`} /></label>
        <label className="mt-3 block text-sm">Checkout phone<input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={`mt-1 w-full rounded-xl border p-3 ${ring}`} /></label>
        <label className="mt-3 block text-sm">Rating<select value={rating} onChange={e => setRating(Number(e.target.value))} className={`mt-1 w-full rounded-xl border p-3 ${ring}`}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} stars</option>)}</select></label>
        <label className="mt-3 block text-sm">Title (optional)<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={`mt-1 w-full rounded-xl border p-3 ${ring}`} /></label>
        <label className="mt-3 block text-sm">Your review<textarea required minLength={5} value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} rows={4} className={`mt-1 w-full rounded-xl border p-3 ${ring}`} /></label>
        <button disabled={busy} className={`mt-4 min-h-12 w-full rounded-full bg-[#a83c70] p-3 font-semibold text-white disabled:opacity-50 ${ring}`}>{busy ? 'Submitting…' : 'Submit review'}</button>{reviewMsg && <p role="status" className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-sm ${reviewOk ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{reviewOk && <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}{reviewMsg}</p>}</form>}</div></div></section>

    
    {recent.length > 0 && <section className="mt-16"><h2 className="font-serif text-3xl">Recently viewed</h2><div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">{recent.map(p => <ProductCard key={p.id} p={p} onAdd={addRelated} wished={wish.includes(p.id)} onWish={toggleWish} />)}</div></section>}
  </div>
  <AddedOverlay item={addedItem} onClose={() => setAddedItem(null)} viewCartHref="/checkout" />
  {showBar && <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-pink-100 bg-white/95 px-4 pt-3 backdrop-blur md:hidden" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-pink-50">{imgs[0] && <img src={imgs[0].image_url} alt="" className="h-full w-full object-cover" />}</div>
    <div className="min-w-0 flex-1"><p className="truncate text-xs">{product.name}</p><p className="text-sm font-semibold text-[#a83c70]">{money(price)}</p></div>
    <button disabled={!buyable} onClick={add} className={`min-h-11 rounded-full bg-[#a83c70] px-6 text-sm font-semibold text-white disabled:bg-gray-300 ${ring}`}>{buyable ? 'Add to Bag' : 'Sold Out'}</button></div>}
  
  <WhatsAppFab lift={showBar} message={`Product: ${product.name} ${pageUrl}`.trim()} />
  </main>;
}
