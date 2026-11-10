'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, BadgeCheck, Truck, Banknote, ArrowRight } from 'lucide-react';

type Order = { id: string; order_number: string; customer_name: string; total_amount: number; payment_status: string; order_status: string; created_at: string; payments: { transaction_reference: string | null; payment_status: string }[] };
const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString('en-PK')}`;
const payState = (o: Order) => { const p = o.payments?.[0]; return !p?.transaction_reference ? 'not_submitted' : p.payment_status === 'verified' ? 'verified' : p.payment_status === 'rejected' ? 'rejected' : 'awaiting'; };

export default function DashboardHome() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(() => { fetch('/api/admin/orders').then(r => (r.ok ? r.json() : null)).then(d => setOrders(d ? (d.orders || []) : [])).catch(() => setOrders([])); }, []);
  if (orders === null) return <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map(i => <div key={i} className="da-skeleton h-28 rounded-2xl" />)}</div>;
  const awaiting = orders.filter(o => payState(o) === 'awaiting');
  const toProcess = orders.filter(o => payState(o) === 'verified' && ['received', 'processing'].includes(o.order_status));
  const revenue = orders.filter(o => payState(o) === 'verified').reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const stats = [
    { label: 'Total orders', value: String(orders.length), icon: ClipboardList, tone: 'bg-pink-50 text-pink-700' },
    { label: 'Payment verify karna hai', value: String(awaiting.length), icon: BadgeCheck, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Pack / dispatch karna hai', value: String(toProcess.length), icon: Truck, tone: 'bg-blue-50 text-blue-700' },
    { label: 'Verified revenue', value: money(revenue), icon: Banknote, tone: 'bg-green-50 text-green-700' }
  ];
  return <>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(s => { const I = s.icon; return <div key={s.label} className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm"><span className={`inline-grid h-10 w-10 place-items-center rounded-xl ${s.tone}`}><I size={19} /></span><p className="mt-3 text-2xl font-bold">{s.value}</p><p className="text-xs font-medium text-gray-500">{s.label}</p></div>; })}</div>
    {awaiting.length > 0 && <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="flex items-center justify-between text-base font-bold text-amber-900">⚠ Pehle ye karein — payment verification baqi hai <Link href="/admin/dashboard/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-pink-700">Orders kholein <ArrowRight size={14} /></Link></h2>
      <ul className="mt-3 divide-y divide-amber-100">{awaiting.slice(0, 5).map(o => <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><span className="font-mono font-semibold">{o.order_number}</span><span className="text-gray-600">{o.customer_name}</span><span className="font-semibold">{money(o.total_amount)}</span><span className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString('en-PK')}</span></li>)}</ul>
      {awaiting.length > 5 && <p className="mt-2 text-xs text-amber-800">…aur {awaiting.length - 5} orders aur hain.</p>}
    </section>}
    {orders.length > 0 && <section className="mt-6 rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold">Recent orders</h2>
      <ul className="mt-3 divide-y divide-pink-50">{orders.slice(0, 5).map(o => <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"><span className="font-mono font-semibold">{o.order_number}</span><span className="text-gray-600">{o.customer_name}</span><span className="capitalize text-gray-500">{o.order_status}</span><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${payState(o) === 'verified' ? 'bg-green-100 text-green-800' : payState(o) === 'rejected' ? 'bg-red-100 text-red-700' : payState(o) === 'awaiting' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>{payState(o) === 'verified' ? 'Verified' : payState(o) === 'rejected' ? 'Rejected' : payState(o) === 'awaiting' ? 'Verify karein' : 'No payment yet'}</span><span className="font-semibold">{money(o.total_amount)}</span></li>)}</ul>
    </section>}
  </>;
}
