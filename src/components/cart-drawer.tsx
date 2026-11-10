'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart, maxQty } from '@/lib/cart';
import { money } from '@/lib/format';

export default function CartDrawer({ open, onClose, fee }: { open: boolean; onClose: () => void; fee?: number }) {
  const { lines, subtotal, setQty, remove } = useCart();
  useEffect(() => {
    if (!open) return; const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc); };
  }, [open, onClose]);
  if (!open) return null;
  const ring = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a83c70]';
  return <div className="fixed inset-0 z-[90] flex justify-end bg-[#352331]/40 backdrop-blur-[2px]" onClick={onClose}>
    <aside role="dialog" aria-modal="true" aria-label="Your bag" className="da-drawer flex h-full w-full max-w-md flex-col bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5"><h2 className="font-serif text-2xl">Your Bag</h2><button type="button" onClick={onClose} aria-label="Close bag" className={`grid h-11 w-11 place-items-center rounded-full hover:bg-pink-50 ${ring}`}><X size={20} /></button></div>
      {lines.length === 0
        ? <div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><span className="grid h-20 w-20 place-items-center rounded-full bg-pink-50"><ShoppingBag size={34} className="text-[#a83c70]" /></span><p className="mt-5 font-serif text-2xl">Your bag is feeling light</p><p className="mt-1 text-sm text-[#6b5360]">Add something lovely to get started.</p><button type="button" onClick={onClose} className={`mt-6 min-h-12 rounded-full bg-[#a83c70] px-8 text-sm font-semibold text-white ${ring}`}>Continue shopping</button></div>
        : <><ul className="flex-1 divide-y divide-pink-50 overflow-y-auto px-6">{lines.map(x => <li key={x.id} className="flex gap-4 py-5">
            <span className="h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-pink-50">{x.image && <img src={x.image} alt="" className="h-full w-full object-cover" />}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{x.name}</span>
              <span className="mt-0.5 block text-sm font-semibold text-[#a83c70] tabular">{money(x.price)}{x.originalPrice && x.originalPrice > x.price && <span className="ml-2 text-xs font-normal text-[#6b5360] line-through">{money(x.originalPrice)}</span>}</span>
              <span className="mt-2 flex items-center gap-1">
                <button type="button" onClick={() => setQty(x.id, x.quantity - 1)} disabled={x.quantity <= 1} aria-label={`Decrease ${x.name}`} className={`grid h-11 w-11 place-items-center rounded-full border border-pink-200 disabled:opacity-40 ${ring}`}><Minus size={14} /></button>
                <span className="w-7 text-center text-sm font-semibold" aria-live="polite">{x.quantity}</span>
                <button type="button" onClick={() => setQty(x.id, x.quantity + 1)} disabled={x.quantity >= maxQty(x.stock)} aria-label={`Increase ${x.name}`} className={`grid h-11 w-11 place-items-center rounded-full border border-pink-200 disabled:opacity-40 ${ring}`}><Plus size={14} /></button>
                <button type="button" onClick={() => remove(x.id)} aria-label={`Remove ${x.name}`} className={`ml-auto grid h-11 w-11 place-items-center rounded-full text-[#6b5360] hover:bg-red-50 hover:text-red-600 ${ring}`}><Trash2 size={17} /></button>
              </span></span></li>)}</ul>
          <div className="border-t border-pink-100 bg-[#fffafd] px-6 pt-5" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
            <div className="flex items-baseline justify-between text-sm"><span>Subtotal</span><b className="text-xl text-[#a83c70] tabular">{money(subtotal)}</b></div>
            <p className="mt-1 text-xs text-[#6b5360]">{fee ? `Delivery (flat ${money(fee)})` : 'Delivery'} is added at checkout.</p>
            <Link href="/checkout" onClick={onClose} className={`mt-4 flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#a83c70] to-[#c4588e] px-6 text-sm font-semibold text-white shadow-lg shadow-pink-200 ${ring}`}>Checkout</Link>
            <p className="mt-3 text-center text-[11px] text-[#6b5360]">Secure advance payment · Easypaisa &amp; JazzCash</p></div></>}
    </aside></div>;
}
