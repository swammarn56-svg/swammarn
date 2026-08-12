create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'staff' check(role in ('admin','manager','staff')),
  permissions jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  category text,
  base_unit text not null check(base_unit in ('g','pcs')),
  purchase_unit text not null default 'pcs',
  unit_factor_to_base numeric(18,6) not null default 1,
  sale_enabled boolean not null default false,
  production_enabled boolean not null default false,
  packaging_enabled boolean not null default false,
  min_stock numeric(18,6) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  recipe_type text not null check(recipe_type in ('production','packaging')),
  version integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(item_id,recipe_type,version)
);

create table if not exists public.recipe_lines (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  component_item_id uuid not null references public.items(id),
  qty_per_output numeric(18,6) not null check(qty_per_output>=0)
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  purchase_date date not null,
  item_id uuid not null references public.items(id),
  quantity numeric(18,6) not null check(quantity>0),
  purchase_unit text not null,
  base_quantity numeric(18,6) not null check(base_quantity>0),
  total_cost numeric(18,2) not null check(total_cost>=0),
  cost_per_base_unit numeric(18,8) not null check(cost_per_base_unit>=0),
  supplier text,
  confirmed boolean not null default false,
  applied boolean not null default false,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_date date not null,
  order_no text unique,
  status text not null default 'pending' check(status in ('pending','issued','completed','cancelled')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_id uuid not null references public.items(id),
  quantity numeric(18,6) not null check(quantity>0)
);

create table if not exists public.daily_operations (
  id uuid primary key default gen_random_uuid(),
  operation_date date not null,
  item_id uuid not null references public.items(id),
  operation_type text not null check(operation_type in ('production','packaging')),
  opening_qty numeric(18,6) not null default 0,
  in_qty numeric(18,6) not null default 0,
  issued_qty numeric(18,6) not null default 0,
  return_qty numeric(18,6) not null default 0,
  damage_qty numeric(18,6) not null default 0,
  used_qty numeric(18,6) not null default 0,
  closing_qty numeric(18,6) not null default 0,
  used_manual boolean not null default false,
  created_at timestamptz not null default now(),
  unique(operation_date,item_id,operation_type)
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null,
  shop_name text,
  total_amount numeric(18,2) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.sale_lines (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  item_id uuid not null references public.items(id),
  quantity numeric(18,6) not null check(quantity>0),
  unit_price numeric(18,2) not null check(unit_price>=0),
  line_total numeric(18,2) generated always as(quantity*unit_price) stored
);

create table if not exists public.inventory_ledger (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  item_id uuid not null references public.items(id),
  source_type text not null,
  source_id uuid,
  qty_delta numeric(18,6) not null,
  unit_cost numeric(18,8) not null default 0,
  value_delta numeric(18,2) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.monthly_closings (
  id uuid primary key default gen_random_uuid(),
  month_start date not null,
  month_end date not null,
  opening_value numeric(18,2) not null default 0,
  purchase_value numeric(18,2) not null default 0,
  used_total_value numeric(18,2) not null default 0,
  damage_total_value numeric(18,2) not null default 0,
  closing_total_value numeric(18,2) not null default 0,
  sales_total_value numeric(18,2) not null default 0,
  locked boolean not null default false,
  closed_by uuid references auth.users(id),
  closed_at timestamptz,
  unique(month_start,month_end)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_purchases_date_item on public.purchases(purchase_date,item_id);
create index if not exists idx_orders_date on public.orders(order_date);
create index if not exists idx_operations_date_item on public.daily_operations(operation_date,item_id);
create index if not exists idx_sales_date on public.sales(sale_date);
create index if not exists idx_ledger_date_item on public.inventory_ledger(event_date,item_id);

create or replace view public.item_weighted_average_cost as
select item_id,
       case when sum(base_quantity)=0 then 0 else sum(total_cost)/sum(base_quantity) end as weighted_avg_cost,
       sum(base_quantity) as purchased_base_qty,
       sum(total_cost) as purchased_value
from public.purchases
where confirmed=true
group by item_id;
