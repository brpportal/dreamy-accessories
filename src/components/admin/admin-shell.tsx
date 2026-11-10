'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, PackageCheck, Package, Tags, Star, BarChart3, Settings, Store, LogOut, Menu, X } from 'lucide-react';

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/dashboard/orders', label: 'Orders & Payments', icon: PackageCheck },
  { href: '/admin/dashboard/products', label: 'Products', icon: Package },
  { href: '/admin/dashboard/categories', label: 'Categories', icon: Tags },
  { href: '/admin/dashboard/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/dashboard/settings', label: 'Settings', icon: Settings }
];
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || ''; const router = useRouter(); const [open, setOpen] = useState(false);
  if (path.startsWith('/admin/login')) return <>{children}</>;
  async function signOut() { try { const { createSupabaseBrowserClient } = await import('@/lib/supabase/client'); await createSupabaseBrowserClient().auth.signOut(); } catch { /* fall through to login */ } router.replace('/admin/login'); }
  const nav = <nav aria-label="Admin" className="flex flex-col gap-1">{links.map(l => { const on = l.exact ? path === l.href : path.startsWith(l.href); const I = l.icon;
    return <Link key={l.href} href={l.href} onClick={() => setOpen(false)} aria-current={on ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium ${on ? 'bg-pink-700 text-white' : 'text-gray-700 hover:bg-pink-50'}`}><I size={18} />{l.label}</Link>; })}
    <div className="my-2 border-t border-pink-100" /><a href="/" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-gray-700 hover:bg-pink-50"><Store size={18} />View store</a>
    <button onClick={signOut} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm text-gray-700 hover:bg-pink-50"><LogOut size={18} />Sign out</button></nav>;
  return <div className="min-h-screen bg-[#fff9fc] lg:flex">
    <aside className="hidden w-64 shrink-0 border-r border-pink-100 bg-white p-4 lg:block"><p className="px-3 pb-4 pt-2 font-serif text-xl font-bold text-pink-700">Sparklesbyfarry Admin</p>{nav}</aside>
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-pink-100 bg-white px-4 py-2 lg:hidden"><p className="font-serif text-lg font-bold text-pink-700">Sparklesbyfarry Admin</p><button onClick={() => setOpen(!open)} aria-label="Toggle admin menu" aria-expanded={open} className="grid h-11 w-11 place-items-center rounded-full text-pink-700">{open ? <X size={22} /> : <Menu size={22} />}</button></div>
    {open && <div className="fixed inset-x-0 top-[57px] z-30 max-h-[calc(100vh-57px)] overflow-y-auto border-b border-pink-100 bg-white p-3 shadow-lg lg:hidden">{nav}</div>}
    <div className="min-w-0 flex-1">{children}</div></div>;
}
