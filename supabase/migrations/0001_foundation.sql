-- Dreamy Accessories / Phase 1 foundation
-- Run in Supabase SQL Editor or with `supabase db push`.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin','super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','super_admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.website_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  description text, image_url text, is_active boolean not null default true,
  display_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  description text, sku text unique, category_id uuid references public.categories(id) on delete set null,
  price numeric(12,2) not null check (price >= 0), sale_price numeric(12,2) check (sale_price is null or sale_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default false, is_featured boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null, display_order integer not null default 0, created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), order_number text not null unique,
  customer_name text not null, customer_phone text not null, customer_city text not null, customer_address text not null,
  subtotal numeric(12,2) not null check (subtotal >= 0), delivery_charges numeric(12,2) not null check (delivery_charges >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0), payment_method text not null check (payment_method in ('easypaisa','jazzcash')),
  payment_status text not null default 'awaiting_payment' check (payment_status in ('awaiting_payment','verification_pending','verified','rejected','refunded')),
  order_status text not null default 'received' check (order_status in ('received','abandoned','processing','dispatched','shipped','delivered','cancelled')),
  settings_snapshot jsonb not null default '{}'::jsonb,
  whatsapp_message_sent_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null, product_sku_snapshot text, quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0), selected_variant jsonb not null default '{}'::jsonb,
  item_total numeric(12,2) not null check (item_total >= 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  payment_method text not null check (payment_method in ('easypaisa','jazzcash')),
  transaction_reference text, payment_amount numeric(12,2) not null check (payment_amount >= 0),
  payment_status text not null default 'verification_pending' check (payment_status in ('verification_pending','verified','rejected','refunded')),
  verified_by uuid references auth.users(id) on delete set null, verified_at timestamptz, rejection_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_user_id uuid references auth.users(id) on delete set null,
  action text not null, entity_type text not null, entity_id text, old_values jsonb, new_values jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active on public.products(is_active);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_orders_phone on public.orders(customer_phone);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_payments_order on public.payments(order_id);
create index if not exists idx_audit_created on public.audit_logs(created_at desc);

-- Default settings are seeded once. Account details are editable later by an authorized admin.
insert into public.website_settings(setting_key,setting_value,is_public) values
('store', '{"store_name":"Dreamy Accessories","currency":"PKR","currency_symbol":"Rs.","contact_email":"","announcement_text":"Beautiful Finds, Delivered Across Pakistan | Delivery Rs. 299"}', true),
('delivery', '{"delivery_fee":299,"coverage":"All Over Pakistan","free_delivery_enabled":false,"free_delivery_threshold":null}', true),
('whatsapp', '{"order_receiving_number":"","support_number":"","display_name":"Dreamy Accessories","order_message":"Assalamualaikum! I would like to place an order."}', true),
('payments', '{"cod_enabled":false,"easypaisa":{"enabled":true,"number":"03224754206","account_name":"Farheen Hussain"},"jazzcash":{"enabled":true,"number":"03400736445","account_name":"Farheen Hussain"},"advance_payment_required":true}', true),
('social', '{"instagram_url":"","facebook_url":""}', true)
on conflict (setting_key) do nothing;

-- Security helper: authorization is based on server-controlled admin_users rows.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users a where a.user_id = auth.uid() and a.is_active = true); $$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users a where a.user_id = auth.uid() and a.is_active = true and a.role = 'super_admin'); $$;

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.website_settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

-- Public reads are limited to public settings and active catalogue content.
create policy "public read public settings" on public.website_settings for select using (is_public = true);
create policy "admins manage settings" on public.website_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "public read active categories" on public.categories for select using (is_active = true);
create policy "admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "public read active products" on public.products for select using (is_active = true);
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "public read images of active products" on public.product_images for select using (exists(select 1 from public.products p where p.id = product_id and p.is_active = true));
create policy "admins manage product images" on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy "users read own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "users update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "admins manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());
create policy "admins read admin users" on public.admin_users for select using (public.is_admin());
create policy "super admins manage admin users" on public.admin_users for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "admins manage orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage order items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage payments" on public.payments for all using (public.is_admin()) with check (public.is_admin());
create policy "admins read audit logs" on public.audit_logs for select using (public.is_admin());
create policy "admins insert audit logs" on public.audit_logs for insert with check (public.is_admin());

-- Deliberately no anonymous insert policy on orders/payments. Phase 3 will add a validated
-- server-side checkout RPC that calculates prices and reserves stock transactionally.

-- Create a profile on signup. Role is always customer; admin provisioning is separate.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles(id, full_name, role) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), 'customer')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
