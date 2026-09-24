-- PRAKABÁ V1 — Fase 2: Produtos, Categorias, Ingredientes/Insumos,
-- Fornecedores, Estoque (com movimentações) e Fichas Técnicas.

-- ============================================================
-- Enums
-- ============================================================
create type public.unit_of_measure as enum ('UNIDADE', 'GRAMA', 'QUILOGRAMA', 'ML', 'LITRO');
create type public.ingredient_kind as enum ('INGREDIENTE', 'INSUMO');
create type public.movement_type as enum (
  'ENTRADA',
  'SAIDA',
  'AJUSTE',
  'CONSUMO_PRODUCAO',
  'PERDA',
  'DEVOLUCAO'
);

-- ============================================================
-- product_categories
-- ============================================================
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create trigger product_categories_set_updated_at
  before update on public.product_categories
  for each row execute function public.set_updated_at();

-- ============================================================
-- suppliers
-- ============================================================
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  phone text,
  email text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger suppliers_set_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

-- ============================================================
-- ingredients (ingredientes de receita e insumos de embalagem)
-- ============================================================
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  kind public.ingredient_kind not null default 'INGREDIENTE',
  unit public.unit_of_measure not null,
  cost_per_unit numeric(12, 4) not null default 0 check (cost_per_unit >= 0),
  current_stock numeric(14, 4) not null default 0 check (current_stock >= 0),
  minimum_stock numeric(14, 4) check (minimum_stock is null or minimum_stock >= 0),
  supplier_id uuid references public.suppliers (id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ingredients_organization_id_idx on public.ingredients (organization_id);

create trigger ingredients_set_updated_at
  before update on public.ingredients
  for each row execute function public.set_updated_at();

-- current_stock só pode ser alterado por register_inventory_movement(), para
-- que nenhuma alteração de estoque aconteça sem uma movimentação registrada.
create or replace function public.prevent_direct_stock_update()
returns trigger
language plpgsql
as $$
begin
  if new.current_stock is distinct from old.current_stock
     and current_setting('prakaba.allow_stock_update', true) is distinct from 'on' then
    raise exception 'current_stock só pode ser alterado via register_inventory_movement()';
  end if;
  return new;
end;
$$;

create trigger ingredients_protect_current_stock
  before update on public.ingredients
  for each row execute function public.prevent_direct_stock_update();

-- ============================================================
-- products
-- ============================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  category_id uuid references public.product_categories (id) on delete set null,
  name text not null check (char_length(trim(name)) > 0),
  sku text,
  description text,
  sale_price numeric(12, 2) not null check (sale_price >= 0),
  sale_unit public.unit_of_measure not null default 'UNIDADE',
  minimum_stock numeric(14, 4) check (minimum_stock is null or minimum_stock >= 0),
  production_time_minutes integer check (production_time_minutes is null or production_time_minutes >= 0),
  shelf_life_days integer check (shelf_life_days is null or shelf_life_days >= 0),
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, sku)
);

create index products_organization_id_idx on public.products (organization_id);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ============================================================
-- recipes / recipe_items (ficha técnica)
-- ============================================================
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  product_id uuid not null unique references public.products (id) on delete cascade,
  yield_quantity numeric(12, 2) not null check (yield_quantity > 0),
  additional_cost numeric(12, 2) not null default 0 check (additional_cost >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

create table public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  quantity numeric(14, 4) not null check (quantity > 0),
  unit public.unit_of_measure not null,
  created_at timestamptz not null default now(),
  unique (recipe_id, ingredient_id)
);

-- ============================================================
-- inventory_movements (registro append-only)
-- ============================================================
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  type public.movement_type not null,
  quantity numeric(14, 4) not null check (quantity <> 0),
  unit public.unit_of_measure not null,
  reason text,
  reference text,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index inventory_movements_ingredient_id_created_at_idx
  on public.inventory_movements (ingredient_id, created_at desc);

-- ============================================================
-- Conversão segura de unidades
-- ============================================================
create or replace function public.convert_quantity(
  p_quantity numeric,
  p_from_unit public.unit_of_measure,
  p_to_unit public.unit_of_measure
)
returns numeric
language plpgsql
immutable
as $$
begin
  if p_from_unit = p_to_unit then
    return p_quantity;
  end if;

  if p_from_unit = 'GRAMA' and p_to_unit = 'QUILOGRAMA' then
    return p_quantity / 1000;
  elsif p_from_unit = 'QUILOGRAMA' and p_to_unit = 'GRAMA' then
    return p_quantity * 1000;
  elsif p_from_unit = 'ML' and p_to_unit = 'LITRO' then
    return p_quantity / 1000;
  elsif p_from_unit = 'LITRO' and p_to_unit = 'ML' then
    return p_quantity * 1000;
  else
    raise exception 'unidades incompatíveis: % -> %', p_from_unit, p_to_unit;
  end if;
end;
$$;

-- ============================================================
-- Registro atômico de movimentação de estoque
-- ============================================================
create or replace function public.register_inventory_movement(
  p_ingredient_id uuid,
  p_type public.movement_type,
  p_quantity numeric,
  p_unit public.unit_of_measure,
  p_reason text default null,
  p_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ingredient public.ingredients%rowtype;
  v_org_id uuid;
  v_role public.user_role;
  v_signed numeric;
  v_converted numeric;
  v_new_stock numeric;
  v_movement_id uuid;
begin
  v_org_id := public.get_my_organization_id();
  v_role := public.get_my_role();

  if v_org_id is null then
    raise exception 'not authenticated';
  end if;

  if v_role not in ('OWNER', 'MANAGER', 'PRODUCTION') then
    raise exception 'not authorized to register inventory movements';
  end if;

  if p_quantity = 0 then
    raise exception 'quantity cannot be zero';
  end if;

  select * into v_ingredient
  from public.ingredients
  where id = p_ingredient_id
  for update;

  if not found or v_ingredient.organization_id <> v_org_id then
    raise exception 'ingredient not found';
  end if;

  case p_type
    when 'ENTRADA', 'DEVOLUCAO' then
      if p_quantity < 0 then
        raise exception 'quantity must be positive for %', p_type;
      end if;
      v_signed := p_quantity;
    when 'SAIDA', 'CONSUMO_PRODUCAO', 'PERDA' then
      if p_quantity < 0 then
        raise exception 'quantity must be positive for %', p_type;
      end if;
      v_signed := -p_quantity;
    when 'AJUSTE' then
      v_signed := p_quantity;
  end case;

  v_converted := public.convert_quantity(abs(v_signed), p_unit, v_ingredient.unit) * sign(v_signed);
  v_new_stock := v_ingredient.current_stock + v_converted;

  if v_new_stock < 0 then
    raise exception 'estoque insuficiente para esta movimentação';
  end if;

  perform set_config('prakaba.allow_stock_update', 'on', true);

  update public.ingredients
  set current_stock = v_new_stock
  where id = p_ingredient_id;

  insert into public.inventory_movements (
    organization_id, ingredient_id, type, quantity, unit, reason, reference, user_id
  ) values (
    v_org_id, p_ingredient_id, p_type, p_quantity, p_unit, p_reason, p_reference, auth.uid()
  )
  returning id into v_movement_id;

  perform public.log_audit_event(
    'ingredient',
    p_ingredient_id,
    'stock_movement',
    jsonb_build_object('stock_before', v_ingredient.current_stock),
    jsonb_build_object('type', p_type, 'quantity', p_quantity, 'unit', p_unit, 'stock_after', v_new_stock)
  );

  return v_movement_id;
end;
$$;

grant execute on function public.register_inventory_movement(
  uuid, public.movement_type, numeric, public.unit_of_measure, text, text
) to authenticated;

-- ============================================================
-- Custo unitário calculado a partir da ficha técnica
-- ============================================================
create or replace function public.calculate_product_cost(p_product_id uuid)
returns numeric
language sql
stable
as $$
  select
    (
      coalesce(sum(public.convert_quantity(ri.quantity, ri.unit, i.unit) * i.cost_per_unit), 0)
      + r.additional_cost
    ) / r.yield_quantity
  from public.recipes r
  left join public.recipe_items ri on ri.recipe_id = r.id
  left join public.ingredients i on i.id = ri.ingredient_id
  where r.product_id = p_product_id
  group by r.id, r.additional_cost, r.yield_quantity;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.product_categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.ingredients enable row level security;
alter table public.products enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_items enable row level security;
alter table public.inventory_movements enable row level security;

-- product_categories: leitura para toda a organização, escrita para staff
create policy product_categories_select_same_org
  on public.product_categories for select
  using (organization_id = public.get_my_organization_id());

create policy product_categories_insert_staff
  on public.product_categories for insert
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  );

create policy product_categories_update_staff
  on public.product_categories for update
  using (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  )
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  );

-- suppliers
create policy suppliers_select_same_org
  on public.suppliers for select
  using (organization_id = public.get_my_organization_id());

create policy suppliers_insert_staff
  on public.suppliers for insert
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  );

create policy suppliers_update_staff
  on public.suppliers for update
  using (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  )
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  );

-- ingredients (a coluna current_stock é protegida pelo trigger acima,
-- independente desta policy)
create policy ingredients_select_same_org
  on public.ingredients for select
  using (organization_id = public.get_my_organization_id());

create policy ingredients_insert_staff
  on public.ingredients for insert
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  );

create policy ingredients_update_staff
  on public.ingredients for update
  using (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  )
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  );

-- products: leitura para toda a organização (necessário para o PDV), escrita
-- para staff
create policy products_select_same_org
  on public.products for select
  using (organization_id = public.get_my_organization_id());

create policy products_insert_staff
  on public.products for insert
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  );

create policy products_update_staff
  on public.products for update
  using (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  )
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  );

-- recipes
create policy recipes_select_same_org
  on public.recipes for select
  using (organization_id = public.get_my_organization_id());

create policy recipes_insert_staff
  on public.recipes for insert
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  );

create policy recipes_update_staff
  on public.recipes for update
  using (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  )
  with check (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  );

create policy recipes_delete_staff
  on public.recipes for delete
  using (
    organization_id = public.get_my_organization_id()
    and public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
  );

-- recipe_items: organização derivada via recipes
create policy recipe_items_select_same_org
  on public.recipe_items for select
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_items.recipe_id
      and r.organization_id = public.get_my_organization_id()
  ));

create policy recipe_items_insert_staff
  on public.recipe_items for insert
  with check (
    public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_items.recipe_id
        and r.organization_id = public.get_my_organization_id()
    )
  );

create policy recipe_items_update_staff
  on public.recipe_items for update
  using (
    public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_items.recipe_id
        and r.organization_id = public.get_my_organization_id()
    )
  )
  with check (
    public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_items.recipe_id
        and r.organization_id = public.get_my_organization_id()
    )
  );

create policy recipe_items_delete_staff
  on public.recipe_items for delete
  using (
    public.get_my_role() in ('OWNER', 'MANAGER', 'PRODUCTION')
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_items.recipe_id
        and r.organization_id = public.get_my_organization_id()
    )
  );

-- inventory_movements: somente leitura direta; toda escrita passa por
-- register_inventory_movement() (SECURITY DEFINER, valida papel e organização)
create policy inventory_movements_select_same_org
  on public.inventory_movements for select
  using (organization_id = public.get_my_organization_id());
