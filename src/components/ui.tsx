'use client';
import { useState } from 'react';
import { ChevronDown, Star } from 'lucide-react';

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>{[1, 2, 3, 4, 5].map(i => {
    const fill = Math.max(0, Math.min(1, value - (i - 1)));
    return <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
      <Star size={size} className="absolute inset-0 text-pink-200" fill="currentColor" strokeWidth={0} />
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}><Star size={size} className="text-amber-500" fill="currentColor" strokeWidth={0} /></span>
    </span>;
  })}</span>;
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
