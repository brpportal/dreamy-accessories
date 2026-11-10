'use client';
import Link from 'next/link';
import { Check, ShoppingBag, ArrowRight } from 'lucide-react';

export type AddedItem = { name: string; image: string };

export default function AddedOverlay({ item, onClose, onViewCart, viewCartHref }: { item: AddedItem | null; onClose: () => void; onViewCart?: () => void; viewCartHref?: string }) {
  if (!item) return null;
  return <div className="da-fade fixed inset-0 z-[95] flex items-center justify-center bg-[#352331]/60 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Added to bag" onClick={onClose}>
    <div className="da-pop w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
      <span className="da-check mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-500 text-white shadow-lg shadow-green-200"><Check size={40} strokeWidth={3} /></span>
      <h2 className="mt-5 font-serif text-2xl text-[#352331]">Added to Bag!</h2>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-pink-50 p-3 text-left">
        <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">{item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : null}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span>
      </div>
      <div className="mt-6 grid gap-3">
        {viewCartHref
          ? <Link href={viewCartHref} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#a83c70] px-6 text-sm font-bold text-white shadow-lg shadow-pink-200"><ShoppingBag size={17} /> View Cart</Link>
          : <button type="button" onClick={onViewCart} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#a83c70] px-6 text-sm font-bold text-white shadow-lg shadow-pink-200"><ShoppingBag size={17} /> View Cart</button>}
        <button type="button" onClick={onClose} className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#a83c70] bg-white px-6 text-sm font-bold text-[#a83c70]">More Shopping <ArrowRight size={16} /></button>
      </div>
    </div>
  </div>;
}
