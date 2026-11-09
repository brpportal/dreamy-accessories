-- 0003 — Business insights (Phase 6.2).
-- WHY: the existing analytics only exposes totals/daily/top-viewed products. To answer "what do customers search for,
-- where do they come from, which products get views but no carts" we need a few extra event fields (search text, results
-- count, utm/referrer, device). This migration ADDS a new table + 2 functions. It does not change 0001/0002 objects or the
-- existing track_store_event / admin_get_analytics functions. Run it once in the Supabase SQL editor.
create table if not exists public.insight_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_name text not null,
  session_id uuid not null,
  page_path text,
  referrer_host text,
  utm_source text,
  utm_medium text,
  product_id uuid references public.products(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  search_query text,
  search_results integer,
  device text
);
create index if not exists idx_insight_events_created on public.insight_events(created_at desc);
create index if not exists idx_insight_events_name on public.insight_events(event_name, created_at desc);
alter table public.insight_events enable row level security;
drop policy if exists "admins read insight events" on public.insight_events;
create policy "admins read insight events" on public.insight_events for select using (public.is_admin());
-- No anon insert/select policy: visitors can only write through the validated function below.

create or replace function public.track_insight_event(
  p_event_name text, p_session_id uuid, p_page_path text, p_referrer_host text, p_utm_source text, p_utm_medium text,
  p_product_id uuid, p_category_id uuid, p_search_query text, p_search_results integer, p_device text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_event_name not in ('page_view','product_view','category_view','search','add_to_cart','remove_from_cart','wishlist_add','whatsapp_click','checkout_started','order_created','payment_submitted') then return; end if;
  insert into public.insight_events(event_name,session_id,page_path,referrer_host,utm_source,utm_medium,product_id,category_id,search_query,search_results,device)
  values (p_event_name,p_session_id,left(coalesce(p_page_path,'/'),300),left(p_referrer_host,120),left(p_utm_source,60),left(p_utm_medium,60),
          (select id from public.products where id = p_product_id), (select id from public.categories where id = p_category_id),
          left(lower(trim(p_search_query)),80), p_search_results, case when p_device in ('mobile','desktop') then p_device else null end);
end $$;
grant execute on function public.track_insight_event(text,uuid,text,text,text,text,uuid,uuid,text,integer,text) to anon, authenticated;

create or replace function public.admin_get_behavior_insights(p_days integer default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_from timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_days,30), 365))); r jsonb;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select jsonb_build_object(
    'since', v_from,
    'funnel', (select coalesce(jsonb_object_agg(event_name, c), '{}'::jsonb) from (select event_name, count(distinct session_id) c from public.insight_events where created_at >= v_from group by 1) f),
    'top_searches', (select coalesce(jsonb_agg(t order by (t->>'count')::int desc), '[]'::jsonb) from (select jsonb_build_object('query',search_query,'count',count(*),'sessions',count(distinct session_id),'avg_results',round(avg(search_results)::numeric,1)) t from public.insight_events where event_name='search' and search_query is not null and length(search_query)>=2 and created_at >= v_from group by search_query order by count(*) desc limit 15) s),
    'no_result_searches', (select coalesce(jsonb_agg(t order by (t->>'count')::int desc), '[]'::jsonb) from (select jsonb_build_object('query',search_query,'count',count(*)) t from public.insight_events where event_name='search' and search_results = 0 and length(search_query)>=2 and created_at >= v_from group by search_query order by count(*) desc limit 15) s),
    'sources', (select coalesce(jsonb_agg(t order by (t->>'sessions')::int desc), '[]'::jsonb) from (select jsonb_build_object('source',coalesce(nullif(utm_source,''),nullif(referrer_host,''),'direct'),'sessions',count(distinct session_id)) t from public.insight_events where event_name='page_view' and created_at >= v_from group by 1 order by count(distinct session_id) desc limit 10) s),
    'devices', (select coalesce(jsonb_agg(jsonb_build_object('device',coalesce(device,'unknown'),'sessions',c)), '[]'::jsonb) from (select device, count(distinct session_id) c from public.insight_events where event_name='page_view' and created_at >= v_from group by 1) d),
    'products', (select coalesce(jsonb_agg(t order by (t->>'views')::int desc), '[]'::jsonb) from (select jsonb_build_object('product_id',p.id,'name',p.name,'views',count(*) filter (where e.event_name='product_view'),'carts',count(*) filter (where e.event_name='add_to_cart'),'wishlists',count(*) filter (where e.event_name='wishlist_add')) t from public.insight_events e join public.products p on p.id = e.product_id where e.created_at >= v_from and e.event_name in ('product_view','add_to_cart','wishlist_add') group by p.id, p.name order by count(*) filter (where e.event_name='product_view') desc limit 30) s),
    'categories', (select coalesce(jsonb_agg(t order by (t->>'views')::int desc), '[]'::jsonb) from (select jsonb_build_object('name',c.name,'views',count(*)) t from public.insight_events e join public.categories c on c.id = e.category_id where e.event_name='category_view' and e.created_at >= v_from group by c.name order by count(*) desc limit 10) s),
    'hours', (select coalesce(jsonb_agg(jsonb_build_object('hour',h,'views',c) order by h), '[]'::jsonb) from (select extract(hour from created_at at time zone 'Asia/Karachi')::int h, count(*) c from public.insight_events where event_name='page_view' and created_at >= v_from group by 1) x),
    'whatsapp_clicks', (select count(*) from public.insight_events where event_name='whatsapp_click' and created_at >= v_from)
  ) into r;
  return r;
end $$;
grant execute on function public.admin_get_behavior_insights(integer) to authenticated;
