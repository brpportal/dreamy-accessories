import Link from 'next/link';
export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-[#fff9fc] px-6 text-center text-[#352331]"><div><p className="text-xs font-semibold uppercase tracking-[.25em] text-[#a83c70]">404</p><h1 className="mt-3 font-serif text-4xl">We could not find that page</h1><p className="mx-auto mt-3 max-w-sm text-sm text-[#6b5360]">The link may be old, or the product may no longer be available.</p><Link href="/products" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[#a83c70] px-8 text-sm font-semibold text-white">Back to the collection</Link></div></main>;
}
