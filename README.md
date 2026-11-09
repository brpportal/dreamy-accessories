# Dreamy Accessories — Phase 1

Foundation package: Next.js App Router + TypeScript + Tailwind CSS + Supabase.

## Included
- Supabase server/browser session-based admin login.
- Protected admin dashboard and business settings page.
- Editable delivery charge, free-delivery option, WhatsApp order/support numbers, Easypaisa/JazzCash details, store information and social links.
- COD is hard-disabled in the settings write path and database seed.
- PostgreSQL migration with foundational catalogue/order/payment tables, RLS policies, indexes, signup profile trigger and audit log.
- Server-side settings validation with Zod.

## Setup
1. Install Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the Supabase project URL and anon/publishable key. Add the service role key only to server environment if a future server-only operation needs it; it is not used by this phase's settings API.
4. Apply `supabase/migrations/0001_foundation.sql` in the Supabase SQL Editor, or use Supabase CLI migrations.
5. Create the first admin account in Supabase Dashboard → Authentication → Users (invite/create user; public admin registration is not implemented).
6. Copy that user's UUID and run this SQL in the Supabase SQL Editor:

```sql
insert into public.admin_users(user_id, role, is_active)
values ('REPLACE-WITH-AUTH-USER-UUID'::uuid, 'super_admin', true);
```

7. Run `npm run dev` and open `/admin/login`.
8. Configure the order receiving WhatsApp number in Admin → Business Settings. The payment account numbers are seeded from the client's supplied details and remain editable by an authorized admin.

## Commands
- `npm run dev` — local development
- `npm run typecheck` — TypeScript validation
- `npm run lint` — lint
- `npm run build` — production build

## Security notes
- Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable.
- Admin authorization is checked server-side against `admin_users`.
- No anonymous order/payment insert policy is created. Phase 3 must add a server-validated checkout function that recalculates prices and reserves inventory transactionally.
- Payment account details are visible to the public website because checkout needs to display them. Restrict writes to active admins.
- Admin 2FA, rate-limited tracking lookup, payment proof upload, transactional checkout, and courier integrations are later-phase tasks, not claimed as implemented here.

## Phase 1 limitations / configuration still required
- Supabase project credentials and database migration must be supplied/applied by the project owner.
- First super-admin must be provisioned manually using the secure procedure above.
- Client's actual WhatsApp receiving number is not yet known; it is intentionally blank.
- Payment verification workflow and storefront are scheduled for later phases.

## Phase 2 — storefront and guest checkout

Phase 2 adds a mobile-first pink storefront, public active-product catalogue, browser cart, guest checkout, and a server-side transactional checkout RPC. The checkout RPC calculates product prices and delivery fees from Supabase, locks products, checks stock, writes order/order-item/payment records, and decrements stock in one database transaction. Only after the database confirms the order does the browser attempt to open WhatsApp. COD remains disabled.

### Apply Phase 2
1. Apply `supabase/migrations/0002_storefront_checkout.sql` in the Supabase SQL Editor after Phase 1 migration.
2. Configure `.env.local` from `.env.example` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Run `npm install`, then `npm run dev`.
4. Add active products, stock quantities, and image URLs in Supabase (or through the admin catalogue tools when those are implemented).
5. Configure the order-receiving WhatsApp number in the admin settings. Until then, checkout still saves the order and shows a notice rather than opening WhatsApp.

### Phase 2 notes / limits
- Product management UI, payment-proof submission/review, order tracking, automated WhatsApp provider delivery, and customer accounts are not part of this phase.
- Product images use external image URLs; no object/file storage bucket is required.
- The checkout stores a payment record as `verification_pending`; it does not verify a bank transfer automatically.
- The displayed checkout subtotal is an estimate. The database RPC recalculates all prices and delivery at order time.
- Before production launch, add infrastructure-level rate limiting/CAPTCHA, configure a verified WhatsApp number, review the deployed Supabase RLS/grants, and test the migration and checkout with real staging credentials.

## 2026-11-09 Stability Update
See `UPDATE-2026-11-09.md` for the admin login password visibility toggle, Vercel Supabase environment variable compatibility, removal of the public Admin footer link, API admin authorization hardening, verification status, and deployment steps.
