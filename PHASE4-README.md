# Dreamy Accessories — Phase 4

Adds admin product creation with image URL or Storage upload, review moderation, and analytics dashboard/API.

## Setup
1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon key), and `SUPABASE_SERVICE_ROLE_KEY` only on the server if existing Phase 1 routes require it. Never expose service-role keys in `NEXT_PUBLIC_` variables.
3. Install with `npm install`, then run `npm run typecheck` and `npm run build`.
4. The deployed Supabase project must already contain the Phase 1–3 schema, `product_images`, `product_reviews`, `analytics_events`, the `product-images` bucket, and `admin_get_analytics`.

## Admin modules
- `/admin/dashboard/products`: create products and attach one image by URL or upload.
- `/admin/dashboard/reviews`: approve/reject/pending verified-purchaser reviews.
- `/admin/dashboard/analytics`: 7/30/90-day traffic and revenue overview.

## Important integration notes
- Uploads use the signed-in browser client and depend on the existing authenticated-admin Storage INSERT policy.
- Product creation expects columns `name, slug, price, sale_price, description, stock_quantity, is_active`.
- Review moderation expects `product_reviews.review_text` and a `products` relationship. Verify these names against the deployed schema.
- Analytics expects RPC argument `p_days` and JSON keys `totals`, `daily`, `top_products`; verify the actual function contract.
- Category assignment, product editing/deletion, and multi-image ordering are not included.
- Customer-side review form and public event tracking still need wiring. This phase adds the admin surfaces; it does not claim live traffic collection is active.
- COD remains disabled; advance payment only.
