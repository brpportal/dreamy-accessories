import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin';
import DashboardHome from '@/components/admin/dashboard-home';
import { PackageCheck, Package, Tags, Star, BarChart3, Settings, ArrowRight } from 'lucide-react';

const modules = [
  { name: 'Orders & Payments', href: '/admin/dashboard/orders', desc: 'Step 1: Transaction ID verify karein. Step 2: Order ka status badlein. Step 3: Courier tracking lagayein.', icon: PackageCheck },
  { name: 'Products & Images', href: '/admin/dashboard/products', desc: 'Products add/edit karein — price, stock, photos. Delete aur featured yahin se hota hai.', icon: Package },
  { name: 'Categories', href: '/admin/dashboard/categories', desc: 'Categories banayein aur products ko un me rakhein taake shop saaf lage.', icon: Tags },
  { name: 'Reviews Moderation', href: '/admin/dashboard/reviews', desc: 'Customer reviews approve ya reject karein — approved hi site par dikhte hain.', icon: Star },
  { name: 'Store Analytics', href: '/admin/dashboard/analytics', desc: 'Traffic, product views aur sales ka hisaab ek nazar me.', icon: BarChart3 },
  { name: 'Business Settings', href: '/admin/dashboard/settings', desc: 'Store ka naam, delivery charges, WhatsApp number aur payment accounts.', icon: Settings }
];

export default async function Dashboard() {
  const { user, admin } = await requireAdmin();
  return <main className="p-5 md:p-10"><div className="mx-auto max-w-6xl">
    <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#a83c70] to-[#d1659a] px-6 py-8 text-white shadow-lg shadow-pink-200 sm:px-9">
      <p className="text-xs font-bold uppercase tracking-[.25em] text-pink-100">Sparklesbyfarry · Admin</p>
      <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Store control centre</h1>
      <p className="mt-2 text-sm text-pink-100">Assalamualaikum! Naye orders aur pending kaam neechay ek nazar me dikh rahe hain.</p>
      <p className="mt-1 text-xs text-pink-200">Signed in as {user.email} · {admin.role}</p>
    </div>
    <DashboardHome />
    <h2 className="mt-10 text-lg font-bold">Saare sections</h2>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{modules.map(m => { const I = m.icon; return <Link key={m.href} href={m.href} className="group rounded-2xl border border-pink-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-300 hover:shadow-md"><span className="inline-grid h-11 w-11 place-items-center rounded-xl bg-pink-50 text-pink-700"><I size={20} /></span><h3 className="mt-3 text-lg font-semibold">{m.name}</h3><p className="mt-1.5 text-sm leading-6 text-gray-600">{m.desc}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pink-700">Open <ArrowRight size={14} className="transition group-hover:translate-x-0.5" /></span></Link>; })}</div>
  </div></main>;
}
