'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Search, ExternalLink, MessageCircle } from 'lucide-react';

type Order = { id: string; order_number: string; customer_name: string; customer_phone: string; customer_city: string; customer_address: string; subtotal: number; delivery_charges: number; total_amount: number; payment_method: string; payment_status: string; order_status: string; created_at: string; order_items: { product_name_snapshot: string; quantity: number; item_total: number }[]; payments: { id: string; transaction_reference: string | null; payment_status: string; payment_proof_url: string | null; customer_submitted_at: string | null }[]; shipments: { courier_name: string; tracking_number: string; tracking_url: string; shipment_status: string }[] };

const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString('en-PK')}`;
const STATUSES = ['received', 'processing', 'dispatched', 'shipped', 'delivered', 'cancelled'];
const statusStyle: Record<string, string> = { received: 'bg-gray-100 text-gray-700', processing: 'bg-amber-100 text-amber-800', dispatched: 'bg-blue-100 text-blue-800', shipped: 'bg-indigo-100 text-indigo-800', delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-700' };
const waLink = (phone: string) => { const d = (phone || '').replace(/\D/g, ''); const intl = d.startsWith('92') ? d : d.startsWith('0') ? '92' + d.slice(1) : d; return intl ? `https://wa.me/${intl}` : ''; };

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [cardError, setCardError] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [payFilter, setPayFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(ok: boolean, msg: string) { setToast({ ok, msg }); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 6000); }
  async function load() { const r = await fetch('/api/admin/orders'); const j = await r.json(); if (r.ok) setOrders(j.orders); else setError(j.error || 'Could not load orders'); }
  useEffect(() => { load(); }, []);

  async function act(order: Order, key: string, payload: object, successMsg: string) {
    setBusy(key); setCardError(m => ({ ...m, [order.id]: '' }));
    try {
      const r = await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json(); if (!r.ok) throw Error(j.error || 'Action failed');
      await load(); showToast(true, `✓ ${order.order_number} — ${successMsg}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Action failed';
      setCardError(m => ({ ...m, [order.id]: msg })); showToast(false, `${order.order_number} — ${msg}`);
    } finally { setBusy(''); }
  }

  const shown = useMemo(() => orders.filter(o => {
    const pay = o.payments?.[0];
    const payState = !pay?.transaction_reference ? 'not_submitted' : pay.payment_status === 'verified' ? 'verified' : pay.payment_status === 'rejected' ? 'rejected' : 'awaiting';
    if (payFilter !== 'all' && payState !== payFilter) return false;
    if (statusFilter !== 'all' && o.order_status !== statusFilter) return false;
    const q = query.trim().toLowerCase(); if (!q) return true;
    return o.order_number.toLowerCase().includes(q) || o.customer_phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) || o.customer_name.toLowerCase().includes(q) || (o.order_items || []).some(i => i.product_name_snapshot.toLowerCase().includes(q));
  }), [orders, query, payFilter, statusFilter]);

  return <div className="space-y-4">
    <div className="flex flex-col gap-3 rounded-2xl border border-pink-100 bg-white p-4 sm:flex-row sm:items-center">
      <label className="flex min-h-11 flex-1 items-center gap-2 rounded-full border border-pink-200 px-4"><Search size={16} className="shrink-0 text-pink-700" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search order number, phone, customer or product…" aria-label="Search orders" className="w-full bg-transparent text-sm outline-none" /></label>
      <select value={payFilter} onChange={e => setPayFilter(e.target.value)} aria-label="Filter by payment" className="min-h-11 rounded-full border border-pink-200 bg-white px-3 text-sm">
        <option value="all">All payments</option><option value="awaiting">Awaiting verification</option><option value="verified">Verified</option><option value="rejected">Rejected</option><option value="not_submitted">Not submitted</option>
      </select>
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by order status" className="min-h-11 rounded-full border border-pink-200 bg-white px-3 text-sm capitalize">
        <option value="all">All statuses</option>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
    <p className="text-xs text-gray-500" aria-live="polite">{shown.length} of {orders.length} orders</p>
    {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {shown.length === 0 ? <p className="rounded-2xl border bg-white p-6 text-sm text-gray-500">{orders.length === 0 ? 'No orders yet.' : 'No orders match this search/filter.'}</p> : shown.map(o => {
      const pay = o.payments?.[0];
      const payState = !pay?.transaction_reference ? 'not_submitted' : pay.payment_status === 'verified' ? 'verified' : pay.payment_status === 'rejected' ? 'rejected' : 'awaiting';
      const saving = busy.startsWith(o.id);
      return <article key={o.id} className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pink-50 px-5 py-4">
          <div><h2 className="font-mono text-lg font-bold tracking-tight">{o.order_number}</h2><p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString('en-PK')}</p></div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className={`rounded-full px-3 py-1 capitalize ${statusStyle[o.order_status] || 'bg-gray-100 text-gray-700'}`}>{o.order_status}</span>
            <span className={`rounded-full px-3 py-1 ${payState === 'verified' ? 'bg-green-100 text-green-800' : payState === 'rejected' ? 'bg-red-100 text-red-700' : payState === 'awaiting' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>{payState === 'verified' ? 'Payment verified' : payState === 'rejected' ? 'Payment rejected' : payState === 'awaiting' ? 'Payment: verify karein' : 'Payment not submitted'}</span>
          </div>
        </div>
        <div className="grid gap-5 px-5 py-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Customer</p>
            <p className="mt-1.5 font-semibold">{o.customer_name}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-2"><a href={`tel:${o.customer_phone}`} className="font-medium text-pink-700">{o.customer_phone}</a>{waLink(o.customer_phone) && <a href={waLink(o.customer_phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700"><MessageCircle size={11} /> WhatsApp</a>}</p>
            <p className="mt-0.5">{o.customer_city}</p>
            <p className="text-gray-500">{o.customer_address}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Products ordered</p>
            <ul className="mt-1.5 space-y-1">{(o.order_items || []).map((i, n) => <li key={n} className="flex justify-between gap-3"><span className="font-medium">{i.product_name_snapshot} <span className="text-gray-400">× {i.quantity}</span></span><span>{money(i.item_total)}</span></li>)}</ul>
            <div className="mt-2 space-y-0.5 border-t border-dashed border-pink-100 pt-2 text-xs text-gray-500">
              <p className="flex justify-between"><span>Subtotal</span><span>{money(o.subtotal)}</span></p>
              <p className="flex justify-between"><span>Delivery</span><span>{money(o.delivery_charges)}</span></p>
              <p className="flex justify-between text-sm font-bold text-gray-800"><span>Total</span><span>{money(o.total_amount)}</span></p>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Payment — <span className="capitalize">{o.payment_method}</span></p>
            {pay?.transaction_reference ? <><p className="mt-1.5 break-all rounded-lg bg-pink-50 px-2.5 py-2 font-mono text-xs">{pay.transaction_reference}</p>{pay.customer_submitted_at && <p className="mt-1 text-xs text-gray-500">Submitted: {new Date(pay.customer_submitted_at).toLocaleString('en-PK')}</p>}{pay.payment_proof_url && <a href={pay.payment_proof_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-pink-700">View payment proof <ExternalLink size={11} /></a>}</> : <p className="mt-1.5 text-xs text-gray-500">Customer ne abhi payment details submit nahi kiye.</p>}
            {o.shipments?.[0] && <p className="mt-2 text-xs">Courier: <b>{o.shipments[0].courier_name}</b> · {o.shipments[0].tracking_number}</p>}
          </div>
        </div>
        {cardError[o.id] && <p role="alert" className="mx-5 mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{cardError[o.id]}</p>}
        <div className="flex flex-wrap items-center gap-2 border-t border-pink-50 bg-[#fffcfd] px-5 py-3">
          {pay?.id && payState !== 'verified' && <button disabled={saving} onClick={() => act(o, o.id + 'pay', { action: 'payment', paymentId: pay.id, approve: true }, 'Payment verified kar di gayi')} className="min-h-10 rounded-full bg-emerald-700 px-4 text-xs font-bold text-white disabled:opacity-50">{busy === o.id + 'pay' ? 'Saving…' : '✓ Verify payment'}</button>}
          {pay?.id && payState !== 'rejected' && <button disabled={saving} onClick={() => act(o, o.id + 'reject', { action: 'payment', paymentId: pay.id, approve: false, reason: 'Payment could not be verified' }, 'Payment reject kar di gayi')} className="min-h-10 rounded-full border border-red-200 bg-white px-4 text-xs font-bold text-red-600 disabled:opacity-50">{busy === o.id + 'reject' ? 'Saving…' : payState === 'verified' ? 'Change: Reject payment' : 'Reject payment'}</button>}
          {pay?.id && payState === 'verified' && <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700"><CheckCircle2 size={14} /> Verified — change karna ho to Reject dabayein</span>}
          {pay?.id && payState === 'rejected' && <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"><XCircle size={14} /> Rejected — theek ho to Verify dabayein</span>}
          <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-gray-500">Status
            <select value={o.order_status} disabled={saving} onChange={e => act(o, o.id + 'status', { action: 'status', orderId: o.id, status: e.target.value, note: 'Updated by admin' }, `Status "${e.target.value}" ho gaya`)} aria-label={`Change status of ${o.order_number}`} className="min-h-10 rounded-full border border-pink-200 bg-white px-3 text-xs font-semibold capitalize text-gray-800 disabled:opacity-50">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>{busy === o.id + 'status' && <span className="text-pink-700">Saving…</span>}
          </label>
          <button disabled={saving} onClick={() => { const courier = prompt('Courier name?'); if (!courier) return; const trackingNumber = prompt('Tracking number?') || ''; const trackingUrl = prompt('Tracking URL (optional)') || ''; void act(o, o.id + 'ship', { action: 'shipment', orderId: o.id, courier, trackingNumber, trackingUrl }, 'Shipment details save ho gayi'); }} className="min-h-10 rounded-full border border-pink-200 bg-white px-4 text-xs font-semibold disabled:opacity-50">{busy === o.id + 'ship' ? 'Saving…' : 'Add / update shipment'}</button>
        </div>
      </article>;
    })}
    {toast && <div role="status" className={`fixed inset-x-4 bottom-5 z-[100] mx-auto max-w-md rounded-2xl px-5 py-4 text-center text-sm font-semibold text-white shadow-2xl ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>{toast.msg}</div>}
  </div>;
}
