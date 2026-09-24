-- PRAKABÁ V1 — Fase 3: Clientes e Reservas/Encomendas.
--
-- orders/order_items/payments são desenhados para servir tanto reservas
-- (esta fase) quanto vendas presenciais (Fase 4, via order_type = 'SALE'),
-- conforme decisão de arquitetura da Fase 0: os dois fluxos permanecem
-- separados na aplicação, mas compartilham o mesmo modelo de dados.

-- ============================================================
-- Enums
-- ============================================================
create type public.order_type as enum ('SALE', 'RESERVATION');

create type public.order_channel as enum (
  'PRESENCIAL',
  'RESERVA',
  'IFOOD',
  'WHATSAPP',
  'INSTAGRAM',
  'OUTRO'
);

create type public.order_status as enum (
  'PENDENTE',
  'CONFIRMADA',
  'EM_PRODUCAO',
  'PRONTA',
  'ENTREGUE',
  'CANCELADA'
);

create type public.payment_method as enum ('PIX', 'CARTAO', 'DINHEIRO');

-- ============================================================
-- customers
-- ============================================================
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  phone text,
  address text,
  birth_date date,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_organization_id_idx on public.customers (organization_id);

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ============================================================
-- orders
-- ============================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  order_type public.order_type not null,
  channel public.order_channel not null,
  customer_id uuid references public.customers (id) on delete set null,
  status public.order_status not null default 'PENDENTE',
  order_date timestamptz not null default now(),
  scheduled_at timestamptz,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  notes text,
  responsible_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount <= subtotal),
  check (total = subtotal - discount)
);

create index orders_organization_id_idx on public.orders (organization_id);
create index orders_customer_id_idx on public.orders (customer_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- subtotal/discount/total só podem ser alterados via save_reservation()
create or replace function public.prevent_direct_order_totals_update()
returns trigger
language plpgsql
as $$
begin
  if (
    new.subtotal is distinct from old.subtotal
    or new.discount is distinct from old.discount
    or new.total is distinct from old.total
  ) and current_setting('prakaba.allow_order_totals_update', true) is distinct from 'on' then
    raise exception 'subtotal/discount/total só podem ser alterados via save_reservation()';
  end if;
  return new;
end;
$$;

create trigger orders_protect_totals
  before update on public.orders
  for each row execute function public.prevent_direct_order_totals_update();

-- ============================================================
-- order_items (somente via save_reservation)
-- ============================================================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);

-- ============================================================
-- payments (somente via register_payment)
-- ============================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  method public.payment_method not null,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index payments_order_id_idx on public.payments (order_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

-- customers: leitura para toda a organização, escrita para vendas/gestão
create policy customers_select_same_org
  on public.customers for select
  using (organization_id = public.get_my_organization_id());

create policy customers_insert_staff
  on public.customers for insert
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'SALES')
  );

create policy customers_update_staff
  on public.customers for update
  using (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'SALES')
  )
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'SALES')
  );

-- orders: leitura para toda a organização; criação/edição de itens somente
-- via save_reservation() (SECURITY DEFINER); UPDATE direto liberado para
-- mudanças de status/observações (subtotal/discount/total protegidos por
-- trigger acima)
create policy orders_select_same_org
  on public.orders for select
  using (organization_id = public.get_my_organization_id());

create policy orders_update_staff
  on public.orders for update
  using (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'SALES', 'PRODUCTION')
  )
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'SALES', 'PRODUCTION')
  );

-- order_items: somente leitura direta
create policy order_items_select_same_org
  on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and o.organization_id = public.get_my_organization_id()
  ));

-- payments: somente leitura direta
create policy payments_select_same_org
  on public.payments for select
  using (organization_id = public.get_my_organization_id());
