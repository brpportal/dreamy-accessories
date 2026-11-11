-- 0004 — Product variants (shades).
-- WHY: some products (e.g. lip tints) come in named shades. The customer must be able to pick a
-- shade on the product page, and that shade has to survive the whole journey: cart -> order ->
-- WhatsApp message -> admin. This migration only ADDS things:
--   1. products.variants  jsonb array of {"name": "Raspberry Jelly", "stock": null}
--      (stock null = fall back to the product-level stock_quantity; a number = that shade's own stock)
--   2. order_items.variant_name  the shade chosen for that line (null for products without shades)
--      order_items.selected_variant (from 0001) is also filled with {"name": "..."} for new orders.
--   3. create_guest_order is replaced with a variant-aware version (same signature, same return
--      shape, items additionally carry "variant"). Products without variants behave exactly as before.
-- NOTE: track_guest_order is NOT redefined here on purpose — it was created directly in the live
-- database during Phase 5 and its definition is not in this repo. To show shades on /track-order,
-- add 'variant', oi.variant_name to the items jsonb_build_object inside that function (the page
-- already renders it when present). Run this file once in the Supabase SQL editor.

alter table public.products
  add column if not exists variants jsonb not null default '[]'::jsonb;

alter table public.order_items
  add column if not exists variant_name text;

create or replace function public.create_guest_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_city text,
  p_customer_address text,
  p_payment_method text,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_variant text;
  v_shade jsonb;
  v_shade_stock integer;
  v_new_variants jsonb;
  v_subtotal numeric(12,2) := 0;
  v_delivery numeric(12,2) := 299;
  v_total numeric(12,2);
  v_order_id uuid;
  v_order_number text;
  v_settings jsonb;
  v_payment_settings jsonb;
  v_wa jsonb;
  v_lines jsonb := '[]'::jsonb;
  v_method jsonb;
begin
  if length(trim(coalesce(p_customer_name,''))) < 2 then raise exception 'Please enter your full name'; end if;
  if length(regexp_replace(coalesce(p_customer_phone,''),'\D','','g')) < 10 then raise exception 'Please enter a valid phone number'; end if;
  if length(trim(coalesce(p_customer_city,''))) < 2 or length(trim(coalesce(p_customer_address,''))) < 8 then raise exception 'Please enter complete delivery details'; end if;
  if p_payment_method not in ('easypaisa','jazzcash') then raise exception 'Invalid payment method'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then raise exception 'Cart is empty or too large'; end if;

  select setting_value into v_settings from public.website_settings where setting_key='delivery';
  v_delivery := coalesce((v_settings->>'delivery_fee')::numeric,299);
  select setting_value into v_payment_settings from public.website_settings where setting_key='payments';
  v_method := v_payment_settings -> p_payment_method;
  if coalesce((v_method->>'enabled')::boolean,false) is not true then raise exception 'Selected payment method is currently unavailable'; end if;
  select setting_value into v_wa from public.website_settings where setting_key='whatsapp';

  -- Group by product AND shade: one product in two shades is two separate order lines.
  for v_item in select jsonb_build_object('id', item_id, 'variant', variant_name, 'quantity', sum(qty)::integer) from (select (value->>'id')::uuid as item_id, nullif(trim(value->>'variant'),'') as variant_name, coalesce((value->>'quantity')::integer,0) as qty from jsonb_array_elements(p_items)) grouped group by item_id, variant_name loop
    if (v_item->>'id') is null then raise exception 'Invalid cart item'; end if;
    v_qty := greatest(1, least(20, coalesce((v_item->>'quantity')::integer,0)));
    v_variant := v_item->>'variant';
    v_shade := null; v_shade_stock := null;
    select * into v_product from public.products where id=(v_item->>'id')::uuid and is_active=true for update;
    if not found then raise exception 'A product is no longer available'; end if;
    if v_product.stock_quantity < v_qty then raise exception 'Insufficient stock for %',v_product.name; end if;
    if jsonb_typeof(coalesce(v_product.variants,'[]'::jsonb)) = 'array' and jsonb_array_length(v_product.variants) > 0 then
      -- Product has shades: a shade is required and must exist in the catalogue.
      if v_variant is null then raise exception 'Please choose a shade for %',v_product.name; end if;
      select e into v_shade from jsonb_array_elements(v_product.variants) e where lower(trim(e->>'name')) = lower(v_variant) limit 1;
      if v_shade is null then raise exception 'Shade "%" is not available for %',v_variant,v_product.name; end if;
      v_variant := v_shade->>'name'; -- canonical spelling from the catalogue
      if (v_shade->>'stock') is not null then
        v_shade_stock := (v_shade->>'stock')::integer;
        if v_shade_stock < v_qty then raise exception 'Insufficient stock for % (%)',v_product.name,v_variant; end if;
      end if;
    elsif v_variant is not null then
      raise exception 'Shade "%" is not available for %',v_variant,v_product.name;
    end if;
    v_subtotal := v_subtotal + (coalesce(v_product.sale_price,v_product.price) * v_qty);
    v_lines := v_lines || jsonb_build_array(jsonb_build_object('id',v_product.id,'name',v_product.name,'sku',v_product.sku,'variant',v_variant,'quantity',v_qty,'unit_price',coalesce(v_product.sale_price,v_product.price),'item_total',coalesce(v_product.sale_price,v_product.price)*v_qty));
    -- Reserve stock line by line (the 0002 version decremented after the loop; per-line is what
    -- stops two shade lines of one product from overselling it). Any later exception rolls the
    -- whole order back, so this is still all-or-nothing exactly like before.
    update public.products set stock_quantity=stock_quantity-v_qty,updated_at=now() where id=v_product.id;
    if v_shade_stock is not null then
      select jsonb_agg(case when lower(trim(e->>'name')) = lower(v_variant) then jsonb_set(e,'{stock}',to_jsonb(v_shade_stock - v_qty)) else e end order by ord) into v_new_variants from jsonb_array_elements(v_product.variants) with ordinality as t(e, ord);
      update public.products set variants=coalesce(v_new_variants, v_product.variants) where id=v_product.id;
    end if;
  end loop;
  v_total := v_subtotal + v_delivery;
  v_order_number := 'DA-' || to_char(now(),'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.orders(order_number,customer_name,customer_phone,customer_city,customer_address,subtotal,delivery_charges,total_amount,payment_method,settings_snapshot)
  values(v_order_number,trim(p_customer_name),trim(p_customer_phone),trim(p_customer_city),trim(p_customer_address),v_subtotal,v_delivery,v_total,p_payment_method,
    jsonb_build_object('delivery_fee',v_delivery,'payment_account',v_method,'whatsapp',v_wa)) returning id into v_order_id;
  for v_item in select value from jsonb_array_elements(v_lines) loop
    insert into public.order_items(order_id,product_id,product_name_snapshot,product_sku_snapshot,quantity,unit_price,item_total,variant_name,selected_variant)
    values(v_order_id,(v_item->>'id')::uuid,v_item->>'name',v_item->>'sku',(v_item->>'quantity')::integer,(v_item->>'unit_price')::numeric,(v_item->>'item_total')::numeric,
      v_item->>'variant', case when (v_item->>'variant') is null then '{}'::jsonb else jsonb_build_object('name', v_item->>'variant') end);
  end loop;
  insert into public.payments(order_id,payment_method,payment_amount,payment_status) values(v_order_id,p_payment_method,v_total,'verification_pending');
  return jsonb_build_object('order_id',v_order_id,'order_number',v_order_number,'subtotal',v_subtotal,'delivery_fee',v_delivery,'total',v_total,'items',v_lines,
    'payment_method',p_payment_method,'payment_account',v_method,'whatsapp_number',coalesce(v_wa->>'order_receiving_number',''),'store_name',coalesce((select setting_value->>'store_name' from public.website_settings where setting_key='store'),'Dreamy Accessories'));
end;
$$;
revoke all on function public.create_guest_order(text,text,text,text,text,jsonb) from public;
grant execute on function public.create_guest_order(text,text,text,text,text,jsonb) to anon, authenticated;
