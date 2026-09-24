-- PRAKABÁ V1 — Fase 6: Financeiro básico (contas a pagar e a receber).
--
-- Diferente de produtos/estoque/clientes, dados financeiros são sensíveis:
-- leitura e escrita ficam restritas a OWNER/MANAGER/FINANCE (mesma
-- restrição já usada na navegação desde a Fase 1).
--
-- Não há função SECURITY DEFINER aqui: cada conta é uma linha independente,
-- sem operação multi-tabela que precise de atomicidade especial — CRUD
-- comum protegido por RLS já é suficiente.

create table public.financial_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create trigger financial_categories_set_updated_at
  before update on public.financial_categories
  for each row execute function public.set_updated_at();

create table public.accounts_payable (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  description text not null check (char_length(trim(description)) > 0),
  supplier_id uuid references public.suppliers (id) on delete set null,
  category_id uuid references public.financial_categories (id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  due_date date not null,
  paid_at date,
  status text not null default 'PENDENTE' check (status in ('PENDENTE', 'PAGO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_payable_organization_id_idx on public.accounts_payable (organization_id);

create trigger accounts_payable_set_updated_at
  before update on public.accounts_payable
  for each row execute function public.set_updated_at();

create table public.accounts_receivable (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  description text not null check (char_length(trim(description)) > 0),
  customer_id uuid references public.customers (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  due_date date,
  paid_at date,
  payment_method public.payment_method,
  status text not null default 'PENDENTE' check (status in ('PENDENTE', 'PAGO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_receivable_organization_id_idx on public.accounts_receivable (organization_id);

create trigger accounts_receivable_set_updated_at
  before update on public.accounts_receivable
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security — restrita a OWNER/MANAGER/FINANCE
-- ============================================================
alter table public.financial_categories enable row level security;
alter table public.accounts_payable enable row level security;
alter table public.accounts_receivable enable row level security;

create policy financial_categories_select_finance
  on public.financial_categories for select
  using (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'FINANCE')
  );

create policy financial_categories_insert_finance
  on public.financial_categories for insert
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'FINANCE')
  );

create policy financial_categories_update_finance
  on public.financial_categories for update
  using (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'FINANCE')
  )
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'FINANCE')
  );

create policy accounts_payable_select_finance
  on public.accounts_payable for select
  using (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'FINANCE')
  );

create policy accounts_payable_insert_finance
  on public.accounts_payable for insert
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'FINANCE')
  );

create policy accounts_payable_update_finance
  on public.accounts_payable for update
  using (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'FINANCE')
  )
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'FINANCE')
  );

create policy accounts_receivable_select_finance
  on public.accounts_receivable for select
  using (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'FINANCE')
  );

create policy accounts_receivable_insert_finance
  on public.accounts_receivable for insert
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'FINANCE')
  );

create policy accounts_receivable_update_finance
  on public.accounts_receivable for update
  using (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'FINANCE')
  )
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'FINANCE')
  );
