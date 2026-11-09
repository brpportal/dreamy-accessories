'use client';
import { useEffect, useState } from 'react';
type Cat = { id: string; name: string; slug: string; description: string | null; image_url: string | null; is_active: boolean; display_order: number; products: { count: number }[] };
const empty = { name: '', description: '', image_url: '', display_order: '0', is_active: true };
export default function CategoriesManager() {
  const [items, setItems] = useState<Cat[]>([]); const [form, setForm] = useState(empty); const [editId, setEditId] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  async function load() { const r = await fetch('/api/admin/categories'); const j = await r.json(); if (r.ok) setItems(j.categories); else setMsg(j.error || 'Could not load categories'); }
  useEffect(() => { load(); }, []);
  async function save(e: React.FormEvent) { e.preventDefault(); setBusy(true); setMsg('');
    try { const payload = { ...(editId ? { id: editId } : {}), name: form.name, description: form.description || null, image_url: form.image_url, display_order: Number(form.display_order) || 0, is_active: form.is_active };
      const r = await fetch('/api/admin/categories', { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const j = await r.json(); if (!r.ok) throw Error(j.error);
      setMsg(editId ? 'Category updated.' : 'Category added.'); setForm(empty); setEditId(null); await load(); } catch (err) { setMsg(err instanceof Error ? err.message : 'Save failed'); } finally { setBusy(false); } }
  function edit(c: Cat) { setEditId(c.id); setForm({ name: c.name, description: c.description || '', image_url: c.image_url || '', display_order: String(c.display_order), is_active: c.is_active }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async function toggle(c: Cat) { await fetch('/api/admin/categories', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, is_active: !c.is_active }) }); await load(); }
  async function del(c: Cat) { if (!confirm(`Delete "${c.name}"? Its products will stay but have no category.`)) return; const r = await fetch(`/api/admin/categories?id=${c.id}`, { method: 'DELETE' }); const j = await r.json(); setMsg(r.ok ? 'Category deleted.' : j.error); await load(); }
  const inp = 'mt-1 w-full rounded-xl border p-3 text-sm';
  return <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
    <form onSubmit={save} className="h-fit rounded-2xl border border-pink-100 bg-white p-5"><h2 className="text-lg font-semibold">{editId ? 'Edit category' : 'Add category'}</h2>
      <label className="mt-3 block text-sm font-medium">Name<input required minLength={2} maxLength={60} className={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jhumky" /></label>
      <label className="mt-3 block text-sm font-medium">Description (optional)<textarea rows={2} maxLength={300} className={inp} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
      <label className="mt-3 block text-sm font-medium">Image URL (optional)<input className={inp} value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></label>
      <label className="mt-3 block text-sm font-medium">Display order<input type="number" min={0} className={inp} value={form.display_order} onChange={e => setForm({ ...form, display_order: e.target.value })} /></label>
      <label className="mt-3 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Visible on store</label>
      <button disabled={busy} className="mt-4 min-h-12 w-full rounded-xl bg-pink-700 p-3 font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : editId ? 'Update category' : 'Add category'}</button>
      {editId && <button type="button" onClick={() => { setEditId(null); setForm(empty); }} className="mt-2 min-h-11 w-full text-sm text-pink-700">Cancel edit</button>}
      {msg && <p role="status" className="mt-3 text-sm text-pink-800">{msg}</p>}</form>
    <section><h2 className="mb-3 text-lg font-semibold">Categories ({items.length})</h2>{items.length === 0 ? <p className="rounded-2xl border border-pink-100 bg-white p-6 text-sm text-gray-600">No categories yet. Add your first one, then assign it to products.</p> :
      <div className="space-y-3">{items.map(c => <article key={c.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-pink-100 bg-white p-4"><div className="min-w-0 flex-1"><h3 className="font-semibold">{c.name} {!c.is_active && <span className="ml-1 rounded bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-600">Hidden</span>}</h3><p className="text-xs text-gray-500">/{c.slug} · {c.products?.[0]?.count ?? 0} products · order {c.display_order}</p></div>
        <button onClick={() => edit(c)} className="min-h-11 rounded-full border border-pink-200 px-4 text-sm">Edit</button><button onClick={() => toggle(c)} className="min-h-11 rounded-full border border-pink-200 px-4 text-sm">{c.is_active ? 'Hide' : 'Show'}</button><button onClick={() => del(c)} className="min-h-11 rounded-full border border-red-200 px-4 text-sm text-red-700">Delete</button></article>)}</div>}</section></div>;
}
