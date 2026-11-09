'use client';
import Link from 'next/link';
import { Heart, Plus } from 'lucide-react';
import { trackEvent } from '@/components/analytics-tracker';
import { Stars } from '@/components/ui';
import { money, effectivePrice, isOnSale, discountPercent, savings, isPurchasable } from '@/lib/format';

export type Product = { id: string; name: string; slug: string; description: string | null; price: number; sale_price: number | null; stock_quantity: number; is_featured: boolean; category_id?: string | null; rating_average?: number; rating_count?: number; categories?: { name: string } | null; product_images?: { image_url: string; display_order: number }[] };

export default function ProductCard({ p, onAdd, wished, onWish }: { p: Product; onAdd: (p: Product) => void; wished: boolean; onWish: (id: string) => void }) {
  const imgs = [...(p.product_images || [])].sort((a, b) => a.display_order - b.display_order);
  const sold = !isPurchasable(p);
  const sale = isOnSale(p) && !sold;
  return <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-pink-100 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-100 focus-within:shadow-xl">
    <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-pink-100 to-[#fff5f8]">
      <Link href={`/products/${p.slug}`} onClick={() => trackEvent('product_view', { productId: p.id })} aria-label={`View ${p.name}`} className={`block h-full w-full ${sold ? 'opacity-60' : ''}`}>
        {imgs[0] ? <>
          <img src={imgs[0].image_url} alt={p.name} loading="lazy" className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${imgs[1] ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`} />
          {imgs[1] && <img src={imgs[1].image_url} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />}
        </> : <span className="grid h-full place-items-center font-serif text-5xl text-pink-300">{p.name.charAt(0)}</span>}
      </Link>
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
        {sold ? <span className="rounded-full bg-gray-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">Sold Out</span>
          : sale ? <span className="rounded-full bg-[#a83c70] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">−{discountPercent(p)}%</span>
          : p.is_featured ? <span className="rounded-full bg-[#fbf1dc] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7a5a16]">Featured</span> : null}
      </div>
      <button type="button" onClick={() => onWish(p.id)} aria-pressed={wished} aria-label={wished ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`} className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-[#a83c70] shadow-sm transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a83c70]"><Heart size={18} fill={wished ? 'currentColor' : 'none'} /></button>
    </div>
    <div className="flex flex-1 flex-col p-3 sm:p-4">
      {p.categories?.name && <p className="text-[10px] uppercase tracking-wider text-[#8f5a76]">{p.categories.name}</p>}
      <Link href={`/products/${p.slug}`} className="mt-1 line-clamp-2 min-h-[2.5rem] text-[15px] font-medium leading-5 hover:text-[#a83c70]">{p.name}</Link>
      {(p.rating_count || 0) >= 1 && <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#6b5360]"><Stars value={p.rating_average || 0} size={13} /><span>{(p.rating_average || 0).toFixed(1)} ({p.rating_count})</span></p>}
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-[15px] font-semibold text-[#a83c70]">{money(effectivePrice(p))}</span>
        {sale && <span className="text-xs text-gray-400 line-through">{money(p.price)}</span>}
      </div>
      {sale && <p className="mt-0.5 text-[11px] text-[#6b5360]">Save {money(savings(p))}</p>}
      {!sold && p.stock_quantity <= 3 && <p className="mt-0.5 text-[11px] font-medium text-[#a83c70]">Only {p.stock_quantity} left</p>}
      <button type="button" disabled={sold} onClick={() => onAdd(p)} className="mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#a83c70] px-4 text-xs font-semibold text-white transition hover:bg-[#8e2f5e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a83c70] focus-visible:ring-offset-2 disabled:bg-gray-300 disabled:text-gray-500 md:mt-auto md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 md:disabled:opacity-100">{sold ? 'Sold Out' : <>Add to Bag <Plus size={14} /></>}</button>
    </div>
  </article>;
}
