'use client';
import { useCallback, useEffect, useState } from 'react';
// Single source of truth for the bag (localStorage key `da-cart`, same shape as before so old carts keep working).
export type CartLine = { id: string; name: string; price: number; originalPrice?: number; image: string; quantity: number; stock?: number };
const KEY = 'da-cart'; export const CART_EVENT = 'da-cart-changed'; export const OPEN_CART_EVENT = 'da-open-cart';
export const maxQty = (stock?: number) => Math.min(20, stock ?? 20);
export function readCart(): CartLine[] { try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } }
export function writeCart(lines: CartLine[]) { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* storage unavailable */ } window.dispatchEvent(new Event(CART_EVENT)); }
export const openCart = () => window.dispatchEvent(new Event(OPEN_CART_EVENT));
export function addLine(item: Omit<CartLine, 'quantity'>): CartLine[] {
  const cart = readCart(); const old = cart.find(x => x.id === item.id);
  const next = old ? cart.map(x => (x.id === item.id ? { ...x, stock: item.stock, price: item.price, originalPrice: item.originalPrice, quantity: Math.min(maxQty(item.stock), x.quantity + 1) } : x)) : [...cart, { ...item, quantity: 1 }];
  writeCart(next); return next;
}
export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => { const sync = () => setLines(readCart()); sync(); window.addEventListener(CART_EVENT, sync); window.addEventListener('storage', sync); return () => { window.removeEventListener(CART_EVENT, sync); window.removeEventListener('storage', sync); }; }, []);
  const setQty = useCallback((id: string, qty: number) => writeCart(readCart().map(x => (x.id === id ? { ...x, quantity: Math.max(1, Math.min(maxQty(x.stock), qty)) } : x))), []);
  const remove = useCallback((id: string) => writeCart(readCart().filter(x => x.id !== id)), []);
  return { lines, count: lines.reduce((s, x) => s + x.quantity, 0), subtotal: lines.reduce((s, x) => s + x.price * x.quantity, 0), setQty, remove };
}
