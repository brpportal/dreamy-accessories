# Dreamy Accessories — Phase 5 Integration Package

This package extends Phase 4 with customer-facing product/review flows, analytics event capture, guest order tracking, transaction-reference submission, and an admin orders/payment/shipment screen.

## Included in Phase 5
- Product detail route: `/products/[slug]` with approved reviews, rating summary, related products, add-to-cart and verified-purchase review form.
- Review submission API calls `submit_product_review`; customer must provide order number + checkout phone and review remains pending until admin approval.
- Analytics tracker sends page views and commerce events to `track_store_event`; it uses a random browser session UUID and does not send customer phone/email/IP.
- Guest order tracking at `/track-order` uses order number + checkout phone and `track_guest_order`.
- Checkout now includes transaction reference submission through `submit_payment_proof`.
- Admin order screen at `/admin/dashboard/orders` supports payment verification/rejection, order status changes and courier tracking details.
- Checkout API now includes the configured WhatsApp order-receiving/support number from public website settings.
- Fixed admin review API to read the actual `review_title` database column.

## Existing Supabase project
Project: `Online-E-Store` (`cfysxvozxwdqijdeomej`). The current schema and RPCs were inspected against this source package. No new database migration was required for Phase 5; the integration uses existing functions/tables.

## Environment
Copy `.env.example` to `.env.local` and set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` only if a server-side feature actually needs it. Never expose it in a `NEXT_PUBLIC_` variable.

## Critical setup still required
1. **Admin provisioning:** The connected database currently has zero active admin records. Create the intended user in Supabase Auth, then add that user's UUID to `public.admin_users` with role `super_admin` (or ask the project owner to do it securely). Admin dashboard will not work until this exists.
2. **WhatsApp number:** `website_settings.whatsapp.order_receiving_number` is currently blank. Configure the business WhatsApp number in admin settings before expecting order hand-off to WhatsApp.
3. **Payment screenshot upload:** Not enabled in this phase. The private `payment-proofs` bucket currently has an admin read policy only; do not make it public. Customers can submit transaction references. Add a secure signed-upload flow / narrow customer upload policy before enabling screenshots.
4. **Build verification:** `npm install` timed out in this environment, so a full Next.js build/typecheck could not be completed. All 37 TypeScript/TSX files passed a TypeScript transpile syntax check, but this is not a substitute for `npm run build`.
5. **End-to-end tests:** No live order was placed and no payment was submitted, to avoid creating fake customer orders or changing inventory in the live store. Test with a dedicated staging project or an owner-approved test product/order before production.

## Business rules retained
- Guest checkout; phone required.
- Easypaisa/JazzCash advance payment only; COD disabled.
- Current payment accounts and delivery fee remain managed through `website_settings`.
- No customer account/email required.

## Known operational limitations
- Creating an order decrements stock immediately. Existing cancellation/rejection workflow does not automatically restore inventory; reconcile stock manually or add a controlled stock-restoration workflow before heavy use.
- No courier API integration is present; admin can save courier name, tracking number and tracking URL manually.
- Invoices, admin notes and inventory adjustment RPCs exist in the backend but are not exposed in the Phase 5 admin UI.
- Product manager supports creation and one image per product; editing/deleting and multi-image gallery management remain future work.
