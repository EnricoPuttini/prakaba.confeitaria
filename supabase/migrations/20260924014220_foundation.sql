-- PRAKABÁ V1 — Fase 1: Fundação
-- Organizações, perfis de usuário, roles e auditoria, com RLS multi-tenant.

-- ============================================================
-- Extensões
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================
create type public.user_role as enum (
  'OWNER',
  'MANAGER',
  'SALES',
  'PRODUCTION',
  'FINANCE'
);

-- ============================================================
-- Função utilitária de updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- organizations
-- ============================================================
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- ============================================================
-- profiles (1:1 com auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) > 0),
  role public.user_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_organization_id_idx on public.profiles (organization_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- audit_logs
-- ============================================================
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  entity text not null,
  entity_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_organization_id_created_at_idx
  on public.audit_logs (organization_id, created_at desc);

-- ============================================================
-- Funções auxiliares de sessão (SECURITY DEFINER para evitar
-- recursão de RLS ao consultar o próprio perfil)
-- ============================================================
create or replace function public.get_my_organization_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

create or replace function public.get_my_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- Bootstrap: criação de organização + owner no cadastro
-- ============================================================
create or replace function public.create_organization_with_owner(
  org_name text,
  owner_full_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'user already belongs to an organization';
  end if;

  insert into public.organizations (name)
  values (org_name)
  returning id into new_org_id;

  insert into public.profiles (id, organization_id, full_name, role, active)
  values (auth.uid(), new_org_id, owner_full_name, 'OWNER', true);

  return new_org_id;
end;
$$;

grant execute on function public.create_organization_with_owner(text, text) to authenticated;

-- ============================================================
-- Auditoria: helper para registrar eventos (usado por fases futuras)
-- ============================================================
create or replace function public.log_audit_event(
  p_entity text,
  p_entity_id uuid,
  p_action text,
  p_old_data jsonb default null,
  p_new_data jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (organization_id, user_id, entity, entity_id, action, old_data, new_data)
  values (public.get_my_organization_id(), auth.uid(), p_entity, p_entity_id, p_action, p_old_data, p_new_data);
end;
$$;

grant execute on function public.log_audit_event(text, uuid, text, jsonb, jsonb) to authenticated;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;

-- organizations: membros só enxergam a própria organização
create policy organizations_select_own
  on public.organizations for select
  using (id = public.get_my_organization_id());

create policy organizations_update_owner
  on public.organizations for update
  using (id = public.get_my_organization_id() and public.get_my_role() = 'OWNER')
  with check (id = public.get_my_organization_id() and public.get_my_role() = 'OWNER');

-- profiles: membros da mesma organização podem ler; edição própria ou por OWNER/MANAGER
create policy profiles_select_same_org
  on public.profiles for select
  using (organization_id = public.get_my_organization_id());

create policy profiles_update_self_or_admin
  on public.profiles for update
  using (
    organization_id = public.get_my_organization_id()
    and (id = auth.uid() or public.get_my_role() in ('OWNER', 'MANAGER'))
  )
  with check (
    organization_id = public.get_my_organization_id()
    and (id = auth.uid() or public.get_my_role() in ('OWNER', 'MANAGER'))
  );

-- audit_logs: leitura restrita à própria organização; escrita apenas via função
create policy audit_logs_select_same_org
  on public.audit_logs for select
  using (organization_id = public.get_my_organization_id());
