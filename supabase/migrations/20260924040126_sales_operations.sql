-- PRAKABÁ V1 — Fase 4: Operação de caixa (venda presencial).
--
-- Uma operação representa um dia/ponto de venda presencial: abre com um
-- caixa inicial, acumula vendas (orders com order_type = 'SALE') e fecha
-- com a contagem do dinheiro físico, calculando a diferença de caixa.

create type public.operation_status as enum ('ABERTA', 'FECHADA');

create table public.sales_operations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  location text,
  status public.operation_status not null default 'ABERTA',
  opened_by uuid references auth.users (id) on delete set null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_cash numeric(12, 2) not null default 0 check (opening_cash >= 0),
  expected_cash numeric(12, 2),
  closing_cash_counted numeric(12, 2),
  cash_difference numeric(12, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sales_operations_organization_id_idx on public.sales_operations (organization_id);

create trigger sales_operations_set_updated_at
  before update on public.sales_operations
  for each row execute function public.set_updated_at();

alter table public.orders
  add column operation_id uuid references public.sales_operations (id) on delete set null;

create index orders_operation_id_idx on public.orders (operation_id);

alter table public.sales_operations enable row level security;

-- somente leitura direta; abertura/fechamento apenas via funções
create policy sales_operations_select_same_org
  on public.sales_operations for select
  using (organization_id = public.get_my_organization_id());
