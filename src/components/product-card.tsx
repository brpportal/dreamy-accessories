'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Plus, Check, Zap } from 'lucide-react';
import { trackEvent } from '@/components/analytics-tracker';
import { Stars } from '@/components/ui';
import { addLineQty } from '@/lib/cart';
import { money, effectivePrice, isOnSale, discountPercent, savings, isPurchasable } from '@/lib/format';

export type Product = { id: string; name: string; slug: string; description: string | null; price: number; sale_price: number | null; stock_quantity: number; is_featured: boolean; category_id?: string | null; rating_average?: number; rating_count?: number; categories?: { name: string } | null; product_images?: { image_url: string; display_order: number }[] };

export default function ProductCard({ p, onAdd, wished, onWish, hideAdd = false }: { p: Product; onAdd: (p: Product) => void; wished: boolean; onWish: (id: string) => void; hideAdd?: boolean }) {
  const router = useRouter();
  const buyNow = () => { addLineQty({ id: p.id, name: p.name, price: effectivePrice(p), originalPrice: isOnSale(p) ? p.price : undefined, image: imgs[0]?.image_url || '', stock: p.stock_quantity }, 1); trackEvent('buy_now', { productId: p.id }); router.push('/checkout'); };
  const imgs = [...(p.product_images || [])].sort((a, b) => a.display_order - b.display_order);
  const sold = !isPurchasable(p);
  const sale = isOnSale(p) && !sold;
  const [justAdded, setJustAdded] = useState(false);
  const rated = (p.rating_count || 0) >= 1;
  return <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-pink-100/80 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(168,60,112,.38)] focus-within:shadow-[0_18px_40px_-18px_rgba(168,60,112,.38)]">
    <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-[#fbe3ee] to-[#fff5f8]">
      <Link href={`/products/${p.slug}`} onClick={() => trackEvent('product_view', { productId: p.id })} aria-label={`View ${p.name}`} className={`block h-full w-full ${sold ? 'opacity-60' : ''}`}>
        {imgs[0] ? <>
          <img src={imgs[0].image_url} alt={p.name} loading="lazy" className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${imgs[1] ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`} />
          {imgs[1] && <img src={imgs[1].image_url} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:opacity-100" />}
        </> : <span className="grid h-full place-items-center font-serif text-6xl text-pink-300">{p.name.charAt(0)}</span>}
      </Link>
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
        {sold ? <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-gray-600 shadow-sm">Sold Out</span>
          : sale ? <span className="rounded-full bg-[#a83c70] px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-white shadow-sm">−{discountPercent(p)}%</span>
          : p.is_featured ? <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#7a5a16] shadow-sm ring-1 ring-[#ead7a8]">Featured</span> : null}
      </div>
      <button type="button" onClick={() => onWish(p.id)} aria-pressed={wished} aria-label={wished ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`} className="absolute right-2.5 top-2.5 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-[#a83c70] shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a83c70]"><Heart size={18} fill={wished ? 'currentColor' : 'none'} /></button>
    </div>
    <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
      {p.categories?.name && <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#a0678a]">{p.categories.name}</p>}
      <Link href={`/products/${p.slug}`} className="mt-1 line-clamp-2 min-h-[2.7rem] font-serif text-[1.02rem] font-semibold leading-[1.35] text-[#352331] transition hover:text-[#a83c70]">{p.name}</Link>
      <p className="mt-2 flex items-center gap-2 text-xs text-[#6b5360]">
        <Stars value={rated ? p.rating_average || 0 : 0} size={14} />
        {rated ? <span className="tabular"><b className="font-semibold text-[#352331]">{(p.rating_average || 0).toFixed(1)}</b> ({p.rating_count})</span> : <span className="text-[11px] text-[#8a7380]">No reviews yet</span>}
      </p>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 tabular">
        <span className="text-[1.05rem] font-bold text-[#a83c70]">{money(effectivePrice(p))}</span>
        {sale && <span className="text-xs text-[#7b6572] line-through">{money(p.price)}</span>}
        {sale && <span className="text-[11px] font-medium text-[#2f7d4f]">Save {money(savings(p))}</span>}
      </div>
      {!sold && p.stock_quantity <= 3 && <p className="mt-1 text-[11px] font-medium text-[#a83c70]">Only {p.stock_quantity} left</p>}
      {(!hideAdd || !sold) && <div className="mt-4 space-y-2 md:mt-auto">
        {!hideAdd && <button type="button" disabled={sold} onClick={() => { onAdd(p); setJustAdded(true); setTimeout(() => setJustAdded(false), 1600); }} className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-semibold text-white shadow-md shadow-pink-200/70 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a83c70] focus-visible:ring-offset-2 disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none ${justAdded ? 'bg-green-700' : 'bg-gradient-to-r from-[#a83c70] to-[#c4588e] hover:brightness-110'}`}>{sold ? 'Sold Out' : justAdded ? <>Added <Check size={15} /></> : <>Add to Bag <Plus size={15} /></>}</button>}
        {!sold && <button type="button" onClick={buyNow} aria-label={`Buy ${p.name} now`} className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#352331] px-4 text-[13px] font-semibold text-white shadow-md transition hover:bg-[#241722] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#352331] focus-visible:ring-offset-2">Buy It Now <Zap size={15} /></button>}
      </div>}
    </div>
  </article>;
}
