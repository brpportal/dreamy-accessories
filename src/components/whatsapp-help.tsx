'use client';
import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
export default function WhatsAppHelp({ text = 'Order ke baray me madad chahiye? WhatsApp par message karein.', message = '' }: { text?: string; message?: string }) {
  const [cfg, setCfg] = useState<{ n: string; m: string } | null>(null);
  useEffect(() => { fetch('/api/site-settings').then(r => (r.ok ? r.json() : null)).then(d => d?.supportNumber && setCfg({ n: String(d.supportNumber).replace(/\D/g, ''), m: d.supportMessage || '' })).catch(() => {}); }, []);
  if (!cfg?.n) return null;
  return <a href={`https://wa.me/${cfg.n}?text=${encodeURIComponent(`${cfg.m}\n${message}`.trim())}`} target="_blank" rel="noopener noreferrer" className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#128C7E] bg-white px-6 text-sm font-semibold text-[#0f6f63] transition hover:bg-[#f0fbf8]"><MessageCircle size={18} />{text}</a>;
}
