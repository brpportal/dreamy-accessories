# Phase 6 — Premium UI/UX (changelog)

No business logic, RPC, payment, stock or admin code was changed. **No migration needed** (zero schema changes).

## Build status (honest)
- Environment had no network: `npm install`, `npx tsc --noEmit`, `npm run build` and all live smoke tests were **NOT run**.
- Only done: TypeScript *syntax* check of every `src/**/*.ts(x)` file (0 syntax errors). Type errors against React/Next/Supabase types are unchecked — run `npm install && npx tsc --noEmit && npm run build` first.

## Files added
- `src/lib/format.ts` — `money`, effective price, sale %, savings, purchasable (price 0 or stock 0 = not purchasable).
- `src/lib/content/faq.ts`, `src/lib/content/product-info.ts` — editable FAQ / product accordion text (only stated policies; no COD, no free-shipping threshold, no returns promise).
- `src/components/ui.tsx` (Stars, Accordion, Eyebrow), `src/components/product-card.tsx` (single card used everywhere).
- `src/app/api/site-settings/route.ts` — read-only public settings (store name, announcement, delivery fee, support number, social links).
- `src/app/api/reviews/featured/route.ts` — up to 8 recent approved reviews rated 4+; first name + last initial; **no city** (the reviews table has none); empty array if none.
- `src/app/sitemap.ts`, `src/app/robots.ts`, `public/og-cover.jpg` (**designed placeholder** in brand colours, no hero image existed in the repo — replace with a real 1200×630 image).

## Files changed
- `api/products/route.ts` — adds `rating_average` / `rating_count`. Computed server-side from approved reviews only (one query, aggregated in the route; only totals reach the client). Not a SQL view/RPC, to avoid a migration.
- `components/storefront.tsx` — all 11 homepage sections in the requested order; hides categories (<2), featured (none) and testimonials (none) when no real data. Toolbar: search + category chips + price chips + sort + result count + empty state + Clear filters (all client-side, combined). Skeleton loading. Cart drawer: stepper (max = min(20, stock)), slide-out remove, empty state, delivery note from settings, bag pulse, mobile toast (desktop drawer does not auto-open).
- `components/product-detail.tsx` + `products/[slug]/page.tsx` — breadcrumb, gallery (no thumbnails when 1 image), rating summary + breakdown bars, trust trio, sticky mobile buy bar, accordions, share row, related via the shared card, dynamic OG/Twitter metadata (image, name, price). Rating on the page now comes from the same approved-reviews source as the cards (the `get_product_rating_summary` RPC is no longer called here).
- `checkout/checkout-form.tsx`, `checkout/page.tsx` — visual only: two-column on desktop, collapsible summary on mobile, thumbnails, delivery fee shown from settings (display estimate; the RPC still computes the real fee), focus rings on payment tiles. Submit logic and WhatsApp redirect untouched.
- `layout.tsx` (OG/Twitter, metadataBase), `globals.css` (animations, skeleton, reduced-motion), `.env.example`.

## Things to know
- Set `NEXT_PUBLIC_SITE_URL` in Vercel. The fallback `https://dreamyaccessories.vercel.app` is a guess and is used for sitemap/robots/OG URLs.
- Instagram/Facebook footer icons show only if the URL is set in settings; WhatsApp icon shows only if a support/order number is set.
- Cart lines now also store optional `stock` and `originalPrice` (old carts still work).
- The sticky mobile buy bar is not hidden for "cart drawer open" because the product page has no drawer.
- Emojis were removed from storefront, product page and checkout success; track-order and admin pages were not touched.

## Not tested (must be verified after build)
All items in §12 of the brief: homepage rendering, sale badge consistency, filter combinations, gallery/sticky bar/accordions, real guest checkout + stock decrement, admin login + 401s, `/sitemap.xml`, `/robots.txt`, and WhatsApp link preview.

---
# Phase 6.1 — Admin completion, mobile, security (update)

Still **no migration needed**: `categories` table and its admin RLS policies already exist in `0001`. Still **not built/tested** here (no network) — run `npm install && npx tsc --noEmit && npm run build`.

## Admin
- **Navigation shell** (`components/admin/admin-shell.tsx`, `admin/layout.tsx`): sidebar on desktop, hamburger menu on mobile, links to every module + View store + Sign out. Hidden on `/admin/login`.
- **Categories page** (`/admin/dashboard/categories`, `api/admin/categories`): add / edit / hide / delete / order, product count per category. Deleting keeps products (category becomes empty).
- **Products**: full edit (name, category select, price, sale price, stock, SKU, slug, description, active, featured), quick Hide/Feature buttons, search + category filter, add/remove images on existing products. `api/admin/products` now has validated `POST`, `PATCH` (edit) and `PUT` (quick toggles). Sale price must be lower than price.
- Root cause of "no categories / empty related on the store": the old admin form could not set a category or featured flag. Assign categories to products and the storefront category tiles/chips appear.

## Storefront / mobile
- Mobile bottom tab bar (Home · Shop · Track · Bag) so navigation is always visible.
- Product page **related products** now always fill (RPC picks → same category → featured/newest, in-stock first), plus a **Recently viewed** row (localStorage `da-recent`).
- Real low-stock cue on cards ("Only N left", only when stock ≤ 3). No fake urgency.
- Branded 404 and error pages.

## Security
- Security headers (HSTS, nosniff, frame deny, referrer policy, permissions policy); `no-store` on `/api` and `/admin`.
- Best-effort rate limiting (`lib/rate-limit.ts`) on checkout, reviews, payment proof, order tracking and analytics. It is in-memory per server instance — for real protection also enable Vercel Firewall / bot protection.
- Admin inputs validated with zod; all admin routes still 401 when unauthorised.
- **Not added (needs your decision/testing):** Content-Security-Policy, CAPTCHA, admin 2FA (enable MFA in Supabase Auth), stock restoration on cancelled orders.

---
# Phase 6.2 — WhatsApp support, insights dashboard (final round)

**Needs ONE migration this time: `supabase/migrations/0003_business_insights.sql`** (adds table `insight_events` + functions `track_insight_event`, `admin_get_behavior_insights`; touches nothing from 0001/0002 or the existing analytics functions). Without it everything still works; only the behaviour sections (searches, sources, journey, product views) stay empty. Not built/tested here (no network).

## WhatsApp
- Floating WhatsApp button on the landing page and on every product page (product page pre-fills the product name + link). Lifted above the mobile tab bar / sticky buy bar. Hidden automatically if no number is set.
- Admin → Settings: support number (already existed), **new** "Support chat greeting" and "Show floating WhatsApp button" switch. Falls back to the order-receiving number if no support number is set.

## Insights (admin → Analytics)
Sales (from orders, available immediately): verified revenue, pending payments, AOV, customers and returning customers, best sellers, category revenue, order cities, payment methods, order status, weekday pattern, daily table, low stock, not-selling products, low-rated products, cancelled/rejected units per product, CSV export.
Behaviour (after migration 0003): customer journey funnel, exact search words, **searches with no results** (unmet demand), traffic sources (UTM, referrer, direct), mobile vs desktop, views vs add-to-bag vs wishlist per product, categories browsed, busiest hours (Pakistan time), WhatsApp chat clicks.
"What to do next" suggestions are simple rules over these numbers (not AI).
New tracked events: wishlist_add, whatsapp_click, remove_from_cart, search (with result count), category_view. Share links with `?utm_source=instagram` etc. to see campaign performance.

## Limits (honest)
- "Where customers come from" = traffic source + delivery city. Visitor IP/geo location is deliberately not collected.
- Old events recorded before the migration are not in the new behaviour charts.
- Rate limiter is per-instance; CSP, CAPTCHA, admin 2FA and stock restore on cancelled orders are still not implemented.
- Homepage hero/FAQ text is still edited in code (`src/lib/content/faq.ts`), not in admin.
