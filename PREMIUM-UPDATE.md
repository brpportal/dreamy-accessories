# Premium update — Products page, fonts, custom controls

NOT built/tested here (no network). Run: npm install && npm run lint && npx tsc --noEmit && npm run build.
Fonts use next/font/google (Playfair Display headings, Plus Jakarta Sans body); they are downloaded at build time, so the build machine needs internet (Vercel/Netlify do).

## What changed
- Fonts + tokens: layout.tsx loads the two fonts; globals.css maps Tailwind `font-serif` / `font-sans` to them, so EVERY page (store + admin) upgrades automatically. Added colour tokens (`brand`, `ink`, `muted`...).
- Review stars: new pure-SVG `Stars` (exact partial fill, same in all browsers). Product cards now ALWAYS show the star row: real rating + count when reviewed, empty stars + "No reviews yet" when not (no fake ratings).
- No native browser controls: custom `Dropdown` (keyboard + ARIA listbox) used for Sort on /products and the homepage; custom `StarInput` replaces the review-rating <select>; custom switches/choices in filters.
- /products redesign: gradient hero, desktop filter sidebar (categories with counts, price, in-stock, on-sale, saved), mobile bottom-sheet "Filters", active-filter chips, premium skeletons, distinct empty states (search / saved / filters) with suggestion chips, error state, search tracking.
- Product card: refined radius/shadow, serif product titles, Add to Bag always visible (was hover-only on desktop), tabular prices.
- Shared SiteHeader (logo, nav, saved, bag) + shared CartDrawer + one cart library (`lib/cart.ts`): now on /products, product pages (they had NO header) and /track-order. Drawer: Escape closes, scroll lock, 44px targets.
- /track-order: header, footer, WhatsApp help button. 404 button now goes to /products. Added-to-bag overlay closes with Escape.

## Not in this round (from the trust/safety prompt)
Checkout totals on first screen, payment-proof screenshot upload, phone validation, damage-policy line on product/checkout, editable "A note from us", TikTok field, reviews with city (needs migration).
