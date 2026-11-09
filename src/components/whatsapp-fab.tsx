'use client';
import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { trackEvent } from '@/components/analytics-tracker';
// Floating WhatsApp support button. Number, greeting and on/off come from admin Settings (public settings only).
export default function WhatsAppFab({ message, lift = false }: { message?: string; lift?: boolean }) {
  const [cfg, setCfg] = useState<{ number: string; text: string } | null>(null);
  useEffect(() => { fetch('/api/site-settings').then(r => r.ok ? r.json() : null).then(d => { if (d && d.buttonEnabled !== false && d.supportNumber) setCfg({ number: String(d.supportNumber).replace(/\D/g, ''), text: d.supportMessage || '' }); }).catch(() => {}); }, []);
  if (!cfg || !cfg.number) return null;
  const href = `https://wa.me/${cfg.number}?text=${encodeURIComponent(message ? `${cfg.text}\n${message}`.trim() : cfg.text)}`;
  return <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('whatsapp_click')} aria-label="Chat with us on WhatsApp" className={`fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/20 transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 md:bottom-6 ${lift ? 'bottom-24' : 'bottom-20'}`} style={{ marginBottom: 'env(safe-area-inset-bottom)' }}><MessageCircle size={26} fill="currentColor" strokeWidth={1.5} /></a>;
}
