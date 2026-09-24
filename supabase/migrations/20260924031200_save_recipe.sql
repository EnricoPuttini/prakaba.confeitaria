-- PRAKABÁ V1 — Fase 2: salvar ficha técnica (receita) de forma atômica.
-- Substitui a receita inteira do produto (upsert do cabeçalho + replace dos
-- itens) em uma única transação, evitando estados parciais.

create or replace function public.save_recipe(
  p_product_id uuid,
  p_yield_quantity numeric,
  p_additional_cost numeric,
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
  v_product public.products%rowtype;
  v_recipe_id uuid;
  v_item jsonb;
begin
  v_org_id := public.get_my_organization_id();
  v_role := public.get_my_role();

  if v_org_id is null then
    raise exception 'not authenticated';
  end if;

  if v_role not in ('OWNER', 'MANAGER', 'PRODUCTION') then
    raise exception 'not authorized to edit recipes';
  end if;

  select * into v_product from public.products where id = p_product_id;

  if not found or v_product.organization_id <> v_org_id then
    raise exception 'product not found';
  end if;

  if p_yield_quantity <= 0 then
    raise exception 'yield_quantity must be positive';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'recipe must have at least one item';
  end if;

  insert into public.recipes (organization_id, product_id, yield_quantity, additional_cost, notes)
  values (v_org_id, p_product_id, p_yield_quantity, p_additional_cost, p_notes)
  on conflict (product_id) do update
    set yield_quantity = excluded.yield_quantity,
        additional_cost = excluded.additional_cost,
        notes = excluded.notes
  returning id into v_recipe_id;

  delete from public.recipe_items where recipe_id = v_recipe_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if not exists (
      select 1 from public.ingredients
      where id = (v_item ->> 'ingredient_id')::uuid
        and organization_id = v_org_id
    ) then
      raise exception 'ingredient not found';
    end if;

    insert into public.recipe_items (recipe_id, ingredient_id, quantity, unit)
    values (
      v_recipe_id,
      (v_item ->> 'ingredient_id')::uuid,
      (v_item ->> 'quantity')::numeric,
      (v_item ->> 'unit')::public.unit_of_measure
    );
  end loop;

  return v_recipe_id;
end;
$$;

grant execute on function public.save_recipe(uuid, numeric, numeric, text, jsonb) to authenticated;
