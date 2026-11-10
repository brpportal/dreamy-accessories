import Link from 'next/link';
export default function SiteFooter() {
  return <footer className="mt-16 bg-[#382431] px-5 py-10 text-pink-100/80"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm sm:flex-row">
    <div className="text-center sm:text-left"><p className="font-serif text-xl text-white">Sparklesbyfarry</p><p className="mt-1 text-xs">Sparkle. Shine. Inspire.</p></div>
    <nav className="flex gap-6 text-xs" aria-label="Footer"><Link href="/" className="hover:text-white">Home</Link><Link href="/products" className="hover:text-white">Products</Link><Link href="/track-order" className="hover:text-white">Track Order</Link></nav>
    <p className="text-[11px]">© {new Date().getFullYear()} Sparklesbyfarry. All rights reserved.</p></div></footer>;
}
