-- PRAKABÁ V1 — Fase 5: criação/edição de ordens de produção, conclusão com
-- consumo de ingredientes via ficha técnica, e sugestão simples de demanda.

create or replace function public.save_production_order(
  p_order_id uuid,
  p_planned_date date,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_role public.user_role;
  v_order_id uuid;
  v_current_status public.production_status;
  v_item jsonb;
begin
  v_org_id := public.get_my_organization_id();
  v_role := public.get_my_role();

  if v_org_id is null then
    raise exception 'not authenticated';
  end if;

  if v_role not in ('OWNER', 'MANAGER', 'PRODUCTION') then
    raise exception 'not authorized to manage production orders';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'production order must have at least one item';
  end if;

  if p_order_id is null then
    insert into public.production_orders (organization_id, planned_date, notes, responsible_id)
    values (v_org_id, p_planned_date, p_notes, auth.uid())
    returning id into v_order_id;
  else
    select status into v_current_status
    from public.production_orders
    where id = p_order_id and organization_id = v_org_id;

    if not found then
      raise exception 'production order not found';
    end if;

    if v_current_status <> 'PLANEJADA' then
      raise exception 'only a planned production order can be edited';
    end if;

    update public.production_orders
    set planned_date = p_planned_date, notes = p_notes
    where id = p_order_id
    returning id into v_order_id;

    delete from public.production_items where production_order_id = v_order_id;
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if not exists (
      select 1 from public.products
      where id = (v_item ->> 'product_id')::uuid and organization_id = v_org_id
    ) then
      raise exception 'product not found';
    end if;

    if (v_item ->> 'planned_quantity')::numeric <= 0 then
      raise exception 'planned_quantity must be positive';
    end if;

    insert into public.production_items (production_order_id, product_id, planned_quantity)
    values (v_order_id, (v_item ->> 'product_id')::uuid, (v_item ->> 'planned_quantity')::numeric);
  end loop;

  return v_order_id;
end;
$$;

grant execute on function public.save_production_order(uuid, date, text, jsonb) to authenticated;

create or replace function public.complete_production_order(
  p_order_id uuid,
  p_produced_quantities jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_role public.user_role;
  v_order public.production_orders%rowtype;
  v_item jsonb;
  v_product_id uuid;
  v_produced numeric;
  v_recipe public.recipes%rowtype;
  v_recipe_item record;
  v_needed numeric;
  v_ingredient public.ingredients%rowtype;
begin
  v_org_id := public.get_my_organization_id();
  v_role := public.get_my_role();

  if v_org_id is null then
    raise exception 'not authenticated';
  end if;

  if v_role not in ('OWNER', 'MANAGER', 'PRODUCTION') then
    raise exception 'not authorized to complete production orders';
  end if;

  select * into v_order from public.production_orders where id = p_order_id for update;

  if not found or v_order.organization_id <> v_org_id then
    raise exception 'production order not found';
  end if;

  if v_order.status <> 'EM_PRODUCAO' then
    raise exception 'production order must be in progress to be completed';
  end if;

  if p_produced_quantities is null or jsonb_array_length(p_produced_quantities) = 0 then
    raise exception 'informe a quantidade produzida de cada item';
  end if;

  for v_item in select * from jsonb_array_elements(p_produced_quantities)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_produced := (v_item ->> 'produced_quantity')::numeric;

    if not exists (
      select 1 from public.production_items
      where production_order_id = p_order_id and product_id = v_product_id
    ) then
      raise exception 'item not found in this production order';
    end if;

    if v_produced < 0 then
      raise exception 'produced_quantity cannot be negative';
    end if;

    update public.production_items
    set produced_quantity = v_produced
    where production_order_id = p_order_id and product_id = v_product_id;

    -- consome ingredientes proporcionalmente à ficha técnica, quando existir
    select * into v_recipe from public.recipes where product_id = v_product_id;

    if found and v_produced > 0 then
      for v_recipe_item in
        select
          ri.quantity as recipe_quantity,
          ri.unit as recipe_unit,
          i.id as ingredient_id
        from public.recipe_items ri
        join public.ingredients i on i.id = ri.ingredient_id
        where ri.recipe_id = v_recipe.id
      loop
        v_needed := v_recipe_item.recipe_quantity * (v_produced / v_recipe.yield_quantity);

        perform public.register_inventory_movement(
          v_recipe_item.ingredient_id,
          'CONSUMO_PRODUCAO',
          v_needed,
          v_recipe_item.recipe_unit,
          format('Produção #%s', p_order_id)
        );
      end loop;
    end if;

    -- estoque de produto acabado: nunca bloqueado (venda/entrega pode
    -- deixá-lo negativo, é só um indicador para alertas, não uma trava física)
    update public.products
    set current_stock = current_stock + v_produced
    where id = v_product_id;
  end loop;

  update public.production_orders
  set status = 'CONCLUIDA', completed_at = now()
  where id = p_order_id;

  return p_order_id;
end;
$$;

grant execute on function public.complete_production_order(uuid, jsonb) to authenticated;

create or replace function public.get_production_suggestions()
returns table (
  product_id uuid,
  product_name text,
  reserved_demand numeric,
  avg_daily_sales numeric,
  current_stock numeric,
  committed_stock numeric,
  available_stock numeric,
  suggested_quantity numeric
)
language sql
stable
as $$
  with org as (
    select public.get_my_organization_id() as id
  ),
  reserved as (
    select oi.product_id, sum(oi.quantity) as qty
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.organization_id = (select id from org)
      and o.order_type = 'RESERVATION'
      and o.status not in ('ENTREGUE', 'CANCELADA')
    group by oi.product_id
  ),
  historical as (
    select oi.product_id, sum(oi.quantity) / 30.0 as avg_daily
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.organization_id = (select id from org)
      and o.order_type = 'SALE'
      and o.order_date >= now() - interval '30 days'
    group by oi.product_id
  )
  select
    p.id,
    p.name,
    coalesce(r.qty, 0),
    coalesce(h.avg_daily, 0),
    p.current_stock,
    coalesce(r.qty, 0),
    p.current_stock - coalesce(r.qty, 0),
    greatest(0, coalesce(r.qty, 0) + round(coalesce(h.avg_daily, 0)) - (p.current_stock - coalesce(r.qty, 0)))
  from public.products p
  left join reserved r on r.product_id = p.id
  left join historical h on h.product_id = p.id
  where p.organization_id = (select id from org) and p.active
  order by p.name;
$$;

grant execute on function public.get_production_suggestions() to authenticated;
