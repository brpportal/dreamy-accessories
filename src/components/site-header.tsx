'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Menu, ShoppingBag, X } from 'lucide-react';
import CartDrawer from '@/components/cart-drawer';
import { OPEN_CART_EVENT, useCart } from '@/lib/cart';

// Shared storefront header (logo, nav, wishlist, bag). Also owns the bag drawer so every page can open it.
export default function SiteHeader() {
  const { count } = useCart(); const [open, setOpen] = useState(false); const [menu, setMenu] = useState(false); const [scrolled, setScrolled] = useState(false); const [fee, setFee] = useState<number | undefined>();
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8); onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    const openIt = () => setOpen(true); window.addEventListener(OPEN_CART_EVENT, openIt);
    fetch('/api/site-settings').then(r => (r.ok ? r.json() : null)).then(d => d && typeof d.deliveryFee === 'number' && setFee(d.deliveryFee)).catch(() => {});
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener(OPEN_CART_EVENT, openIt); };
  }, []);
  const ring = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a83c70] focus-visible:ring-offset-2';
  const links: [string, string][] = [['/', 'Home'], ['/products', 'Products'], ['/track-order', 'Track Order']];
  return <>
    <header className={`sticky top-0 z-40 border-b border-pink-100/80 bg-white/85 backdrop-blur-md transition-shadow ${scrolled ? 'shadow-md shadow-pink-100/60' : ''}`}>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5"><img src="/logo.jpg" alt="Sparklesbyfarry logo" width={44} height={44} className="h-11 w-11 rounded-xl object-cover ring-1 ring-pink-200" /><span className="font-serif text-[1.35rem] font-bold leading-none tracking-tight text-[#a83c70]">Sparkles<span className="text-[#352331]">byfarry</span></span></Link>
        <nav className="ml-auto hidden items-center gap-8 text-sm font-medium md:flex" aria-label="Main">{links.map(([h, l]) => <Link key={h} href={h} className="text-[#352331] transition hover:text-[#a83c70]">{l}</Link>)}</nav>
        <div className="ml-auto flex items-center gap-1.5 md:ml-2">
          <Link href="/products?wishlist=1" aria-label="Saved items" className={`grid h-11 w-11 place-items-center rounded-full text-[#a83c70] hover:bg-pink-50 ${ring}`}><Heart size={19} /></Link>
          <button type="button" onClick={() => setOpen(true)} aria-label={`Open bag, ${count} items`} className={`relative grid h-11 w-11 place-items-center rounded-full bg-pink-50 text-[#a83c70] ${ring}`}><ShoppingBag size={19} />{count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#a83c70] px-1 text-[10px] font-bold text-white">{count}</span>}</button>
          <button type="button" onClick={() => setMenu(!menu)} aria-label="Toggle menu" aria-expanded={menu} className={`grid h-11 w-11 place-items-center rounded-full text-[#a83c70] md:hidden ${ring}`}>{menu ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {menu && <nav className="border-t border-pink-100 bg-white px-5 py-2 md:hidden" aria-label="Mobile">{links.map(([h, l]) => <Link key={h} href={h} onClick={() => setMenu(false)} className="block min-h-11 py-3 text-sm font-medium">{l}</Link>)}</nav>}
    </header>
    <CartDrawer open={open} onClose={close} fee={fee} />
  </>;
}
