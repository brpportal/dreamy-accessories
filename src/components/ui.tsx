'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

const STAR = 'M12 2.4l2.95 6.1 6.65.9-4.85 4.65 1.2 6.6L12 17.4l-5.95 3.25 1.2-6.6L2.4 9.4l6.65-.9L12 2.4z';
// Pure-SVG star row: partial fill is a clipped rectangle, so it always renders the same in every browser.
export function Stars({ value, size = 14, className = '' }: { value: number; size?: number; className?: string }) {
  const id = useId().replace(/:/g, ''); const v = Math.max(0, Math.min(5, Number.isFinite(value) ? value : 0));
  return <svg role="img" aria-label={`${v.toFixed(1)} out of 5 stars`} width={size * 5} height={size} viewBox="0 0 120 24" className={`shrink-0 ${className}`} preserveAspectRatio="xMinYMid meet">
    <defs><clipPath id={`c${id}`}><rect x="0" y="0" width={(v / 5) * 120} height="24" /></clipPath></defs>
    {[0, 1, 2, 3, 4].map(i => <g key={i} transform={`translate(${i * 24},0)`}><path d={STAR} fill="#f3dde8" stroke="#e8c3d5" strokeWidth=".6" /></g>)}
    <g clipPath={`url(#c${id})`}>{[0, 1, 2, 3, 4].map(i => <g key={i} transform={`translate(${i * 24},0)`}><path d={STAR} fill="#e5a62a" stroke="#c98a12" strokeWidth=".6" /></g>)}</g>
  </svg>;
}

// Custom star picker for the review form (replaces a native <select>).
export function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0); const shown = hover || value; const labels = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
  return <div role="radiogroup" aria-label="Rating" className="mt-1 flex items-center gap-1">
    {[1, 2, 3, 4, 5].map(n => <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-pink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a83c70]">
      <svg width="30" height="30" viewBox="0 0 24 24"><path d={STAR} fill={n <= shown ? '#e5a62a' : '#f3dde8'} stroke={n <= shown ? '#c98a12' : '#e8c3d5'} strokeWidth=".6" /></svg></button>)}
    <span className="ml-2 text-sm text-[#6b5360]">{labels[shown]}</span></div>;
}

export type Option<T extends string> = { value: T; label: string };
// Fully custom dropdown (no native <select>): keyboard accessible listbox with a styled popover.
export function Dropdown<T extends string>({ value, onChange, options, label, ariaLabel, align = 'right' }: { value: T; onChange: (v: T) => void; options: Option<T>[]; label?: string; ariaLabel: string; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false); const [active, setActive] = useState(0); const root = useRef<HTMLDivElement>(null); const uid = useId();
  const current = options.find(o => o.value === value) || options[0];
  useEffect(() => { if (!open) return; const down = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', down); return () => document.removeEventListener('mousedown', down); }, [open]);
  function openMenu() { setActive(Math.max(0, options.findIndex(o => o.value === value))); setOpen(true); }
  function key(e: React.KeyboardEvent) {
    if (!open) { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openMenu(); } return; }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => (i + 1) % options.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (i - 1 + options.length) % options.length); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); } else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(options[active].value); setOpen(false); }
    else if (e.key === 'Tab') setOpen(false);
  }
  return <div ref={root} className="relative">
    <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={`${ariaLabel}: ${current.label}`} aria-controls={`${uid}-list`} onClick={() => (open ? setOpen(false) : openMenu())} onKeyDown={key} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-full border border-pink-200 bg-white px-5 text-sm font-medium text-[#352331] shadow-sm transition hover:border-[#a83c70] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a83c70] focus-visible:ring-offset-2">
      <span className="truncate">{label && <span className="mr-1.5 font-normal text-[#6b5360]">{label}</span>}{current.label}</span><ChevronDown size={16} className={`shrink-0 text-[#a83c70] transition-transform ${open ? 'rotate-180' : ''}`} /></button>
    {open && <ul id={`${uid}-list`} role="listbox" aria-label={ariaLabel} className={`da-menu absolute top-full z-50 mt-2 w-64 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border border-pink-100 bg-white p-1.5 shadow-2xl shadow-pink-200/60 ${align === 'right' ? 'right-0' : 'left-0'}`}>
      {options.map((o, i) => <li key={o.value} role="option" aria-selected={o.value === value} onMouseEnter={() => setActive(i)} onClick={() => { onChange(o.value); setOpen(false); }} className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-4 text-sm ${i === active ? 'bg-pink-50 text-[#a83c70]' : 'text-[#352331]'} ${o.value === value ? 'font-semibold' : ''}`}>{o.label}{o.value === value && <Check size={16} className="text-[#a83c70]" />}</li>)}
    </ul>}
  </div>;
}

export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return <div className="divide-y divide-pink-100 rounded-2xl border border-pink-100 bg-white">{items.map((it, i) => {
    const isOpen = open === i;
    return <div key={it.q}>
      <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)} className="flex min-h-12 w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-[#352331] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a83c70] focus-visible:ring-inset">
        {it.q}<ChevronDown size={18} className={`shrink-0 text-[#a83c70] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}><div className="overflow-hidden"><p className="px-5 pb-5 text-sm leading-7 text-[#6b5360]">{it.a}</p></div></div>
    </div>;
  })}</div>;
}

export function Eyebrow({ label, title, sub }: { label: string; title: string; sub?: string }) {
  return <div className="mb-10 text-center"><p className="text-xs font-semibold uppercase tracking-[.25em] text-[#a83c70]">{label}</p><h2 className="mt-3 font-serif text-3xl text-[#4a2b3c] md:text-4xl">{title}</h2>{sub && <p className="mx-auto mt-3 max-w-md text-sm text-[#6b5360]">{sub}</p>}</div>;
}
