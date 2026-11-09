// Best-effort in-memory rate limiter (per server instance). It blunts casual abuse/bots; it is not a substitute for a WAF.
const hits = new Map<string, number[]>();
export function rateLimit(req: Request, bucket: string, max: number, windowMs: number): boolean {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  const key = `${bucket}:${ip}`; const now = Date.now();
  const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
  if (arr.length >= max) { hits.set(key, arr); return false; }
  arr.push(now); hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < windowMs)) hits.delete(k);
  return true;
}
export const tooMany = () => new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } });
