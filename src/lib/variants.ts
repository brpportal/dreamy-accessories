// Product variants (shades) — one shared shape for the catalogue, admin, cart and checkout.
// DB shape (products.variants jsonb): [{"name":"Raspberry Jelly","stock":null}]
// stock === null means "use the product-level stock_quantity"; a number is that shade's own stock.
export type ProductVariant = { name: string; stock: number | null };
export const MAX_VARIANTS = 20;

// Normalize anything coming from the DB, an API payload or the admin form into clean variants:
// trims names, drops empties, removes case-insensitive duplicates (first spelling wins), caps the list.
export function cleanVariants(input: unknown): ProductVariant[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>(); const out: ProductVariant[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const name = String((raw as { name?: unknown }).name ?? '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const s = (raw as { stock?: unknown }).stock;
    const n = typeof s === 'number' ? s : typeof s === 'string' && s.trim() !== '' ? Number(s) : null;
    out.push({ name, stock: n !== null && Number.isFinite(n) && n >= 0 ? Math.floor(n) : null });
    if (out.length >= MAX_VARIANTS) break;
  }
  return out;
}

export function findVariant(variants: ProductVariant[] | null | undefined, name: string | null | undefined): ProductVariant | undefined {
  if (!variants || !name) return undefined;
  const key = name.trim().toLowerCase();
  return variants.find(v => v.name.trim().toLowerCase() === key);
}

// The stock that actually caps a cart line: the shade's own stock when set, else the product's.
export const variantCapStock = (variant: ProductVariant | undefined, productStock: number) => (variant && variant.stock !== null ? variant.stock : productStock);
