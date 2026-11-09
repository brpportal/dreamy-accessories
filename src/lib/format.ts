export const money = (n: number) => `Rs. ${Number(n).toLocaleString('en-PK')}`;
export type Priced = { price: number; sale_price: number | null };
export const effectivePrice = (p: Priced) => (p.sale_price !== null && p.sale_price !== undefined && p.sale_price < p.price ? p.sale_price : p.price);
export const isOnSale = (p: Priced) => p.sale_price !== null && p.sale_price !== undefined && p.sale_price < p.price && p.price > 0;
export const discountPercent = (p: Priced) => (isOnSale(p) ? Math.round((1 - (p.sale_price as number) / p.price) * 100) : 0);
export const savings = (p: Priced) => (isOnSale(p) ? p.price - (p.sale_price as number) : 0);
// A product priced at 0 is never purchasable (guards against test data looking like a real offer).
export const isPurchasable = (p: Priced & { stock_quantity: number }) => p.stock_quantity > 0 && effectivePrice(p) > 0;
