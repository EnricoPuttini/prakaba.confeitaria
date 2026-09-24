-- PRAKABÁ V1 — Fase 5: Produção.
--
-- Introduz o estoque físico de produtos acabados (products.current_stock),
-- distinto do estoque comprometido por reservas ainda não entregues
-- (calculado sob demanda por get_committed_stock, nunca armazenado, para
-- evitar que ele fique dessincronizado conforme reservas mudam de status).

alter table public.products
  add column current_stock numeric(14, 2) not null default 0;

create or replace function public.get_committed_stock(p_product_id uuid)
returns numeric
language sql
stable
as $$
  select coalesce(sum(oi.quantity), 0)
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where oi.product_id = p_product_id
    and o.order_type = 'RESERVATION'
    and o.status not in ('ENTREGUE', 'CANCELADA');
$$;

create type public.production_status as enum ('PLANEJADA', 'EM_PRODUCAO', 'CONCLUIDA', 'CANCELADA');

create table public.production_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  status public.production_status not null default 'PLANEJADA',
  planned_date date,
  notes text,
  responsible_id uuid references auth.users (id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index production_orders_organization_id_idx on public.production_orders (organization_id);

create trigger production_orders_set_updated_at
  before update on public.production_orders
  for each row execute function public.set_updated_at();

-- uma produção concluída nunca pode "voltar" de status: o estoque e o
-- consumo de ingredientes já foram efetivados de forma irreversível
create or replace function public.prevent_reopening_production_order()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'CONCLUIDA' and new.status <> 'CONCLUIDA' then
    raise exception 'não é possível reabrir uma produção concluída';
  end if;
  return new;
end;
$$;

create trigger production_orders_protect_completed
  before update on public.production_orders
  for each row execute function public.prevent_reopening_production_order();

create table public.production_items (
  id uuid primary key default gen_random_uuid(),
  production_order_id uuid not null references public.production_orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  planned_quantity numeric(12, 2) not null check (planned_quantity > 0),
  produced_quantity numeric(12, 2) check (produced_quantity is null or produced_quantity >= 0),
  created_at timestamptz not null default now(),
  unique (production_order_id, product_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.production_orders enable row level security;
alter table public.production_items enable row level security;

create policy production_orders_select_same_org
  on public.production_orders for select
  using (organization_id = public.get_my_organization_id());

create policy production_orders_insert_staff
  on public.production_orders for insert
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  );

create policy production_orders_update_staff
  on public.production_orders for update
  using (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  )
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  );

create policy production_items_select_same_org
  on public.production_items for select
  using (exists (
    select 1 from public.production_orders po
    where po.id = production_items.production_order_id
      and po.organization_id = public.get_my_organization_id()
  ));

create policy production_items_insert_staff
  on public.production_items for insert
  with check (
    public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
    and exists (
      select 1 from public.production_orders po
      where po.id = production_items.production_order_id
        and po.organization_id = public.get_my_organization_id()
    )
  );

create policy production_items_update_staff
  on public.production_items for update
  using (
    public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
    and exists (
      select 1 from public.production_orders po
      where po.id = production_items.production_order_id
        and po.organization_id = public.get_my_organization_id()
    )
  )
  with check (
    public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
    and exists (
      select 1 from public.production_orders po
      where po.id = production_items.production_order_id
        and po.organization_id = public.get_my_organization_id()
    )
  );

create policy production_items_delete_staff
  on public.production_items for delete
  using (
    public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
    and exists (
      select 1 from public.production_orders po
      where po.id = production_items.production_order_id
        and po.organization_id = public.get_my_organization_id()
    )
  );
