-- RLS foundation. Run after schema.sql.
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_lines enable row level security;
alter table public.purchases enable row level security;
alter table public.orders enable row level security;
alter table public.order_lines enable row level security;
alter table public.daily_operations enable row level security;
alter table public.sales enable row level security;
alter table public.sale_lines enable row level security;
alter table public.inventory_ledger enable row level security;
alter table public.monthly_closings enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "authenticated profiles read" on public.profiles;
drop policy if exists "authenticated items all" on public.items;
drop policy if exists "authenticated recipes all" on public.recipes;
drop policy if exists "authenticated recipe lines all" on public.recipe_lines;
drop policy if exists "authenticated purchases all" on public.purchases;
drop policy if exists "authenticated orders all" on public.orders;
drop policy if exists "authenticated order lines all" on public.order_lines;
drop policy if exists "authenticated daily operations all" on public.daily_operations;
drop policy if exists "authenticated sales all" on public.sales;
drop policy if exists "authenticated sale lines all" on public.sale_lines;
drop policy if exists "authenticated inventory ledger all" on public.inventory_ledger;
drop policy if exists "authenticated monthly closings all" on public.monthly_closings;
drop policy if exists "authenticated audit logs read" on public.audit_logs;

create policy "authenticated profiles read" on public.profiles for select to authenticated using(id=auth.uid());
create policy "authenticated items all" on public.items for all to authenticated using(true) with check(true);
create policy "authenticated recipes all" on public.recipes for all to authenticated using(true) with check(true);
create policy "authenticated recipe lines all" on public.recipe_lines for all to authenticated using(true) with check(true);
create policy "authenticated purchases all" on public.purchases for all to authenticated using(true) with check(true);
create policy "authenticated orders all" on public.orders for all to authenticated using(true) with check(true);
create policy "authenticated order lines all" on public.order_lines for all to authenticated using(true) with check(true);
create policy "authenticated daily operations all" on public.daily_operations for all to authenticated using(true) with check(true);
create policy "authenticated sales all" on public.sales for all to authenticated using(true) with check(true);
create policy "authenticated sale lines all" on public.sale_lines for all to authenticated using(true) with check(true);
create policy "authenticated inventory ledger all" on public.inventory_ledger for all to authenticated using(true) with check(true);
create policy "authenticated monthly closings all" on public.monthly_closings for all to authenticated using(true) with check(true);
create policy "authenticated audit logs read" on public.audit_logs for select to authenticated using(true);

-- These are foundation policies. Before production, replace broad policies
-- with role/permission-specific policies and transaction RPCs.
