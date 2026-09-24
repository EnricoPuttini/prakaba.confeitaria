-- PRAKABÁ V1 — Fase 4: abertura/fechamento de operação e registro de venda
-- presencial, com as mesmas travas de integridade das fases anteriores.

create or replace function public.open_operation(
  p_location text,
  p_opening_cash numeric,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_role public.user_role;
  v_operation_id uuid;
begin
  v_org_id := public.get_my_organization_id();
  v_role := public.get_my_role();

  if v_org_id is null then
    raise exception 'not authenticated';
  end if;

  if v_role not in ('OWNER', 'MANAGER', 'SALES') then
    raise exception 'not authorized to open an operation';
  end if;

  if p_opening_cash < 0 then
    raise exception 'opening_cash cannot be negative';
  end if;

  if exists (
    select 1 from public.sales_operations
    where organization_id = v_org_id and status = 'ABERTA'
  ) then
    raise exception 'there is already an open operation';
  end if;

  insert into public.sales_operations (organization_id, location, opening_cash, notes, opened_by)
  values (v_org_id, p_location, p_opening_cash, p_notes, auth.uid())
  returning id into v_operation_id;

  return v_operation_id;
end;
$$;

grant execute on function public.open_operation(text, numeric, text) to authenticated;

create or replace function public.close_operation(
  p_operation_id uuid,
  p_closing_cash_counted numeric,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_role public.user_role;
  v_operation public.sales_operations%rowtype;
  v_cash_sales numeric;
begin
  v_org_id := public.get_my_organization_id();
  v_role := public.get_my_role();

  if v_org_id is null then
    raise exception 'not authenticated';
  end if;

  if v_role not in ('OWNER', 'MANAGER', 'SALES') then
    raise exception 'not authorized to close an operation';
  end if;

  select * into v_operation
  from public.sales_operations
  where id = p_operation_id
  for update;

  if not found or v_operation.organization_id <> v_org_id then
    raise exception 'operation not found';
  end if;

  if v_operation.status <> 'ABERTA' then
    raise exception 'operation is already closed';
  end if;

  select coalesce(sum(p.amount), 0) into v_cash_sales
  from public.payments p
  join public.orders o on o.id = p.order_id
  where o.operation_id = p_operation_id and p.method = 'DINHEIRO';

  update public.sales_operations
  set status = 'FECHADA',
      closed_at = now(),
      expected_cash = v_operation.opening_cash + v_cash_sales,
      closing_cash_counted = p_closing_cash_counted,
      cash_difference = p_closing_cash_counted - (v_operation.opening_cash + v_cash_sales),
      notes = coalesce(p_notes, v_operation.notes)
  where id = p_operation_id;

  return p_operation_id;
end;
$$;

grant execute on function public.close_operation(uuid, numeric, text) to authenticated;

create or replace function public.create_sale(
  p_operation_id uuid,
  p_channel public.order_channel,
  p_customer_id uuid,
  p_payment_method public.payment_method,
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
  v_operation public.sales_operations%rowtype;
  v_order_id uuid;
  v_subtotal numeric := 0;
  v_quantity numeric;
  v_unit_price numeric;
  v_product_price numeric;
  v_item jsonb;
begin
  v_org_id := public.get_my_organization_id();
  v_role := public.get_my_role();

  if v_org_id is null then
    raise exception 'not authenticated';
  end if;

  if v_role not in ('OWNER', 'MANAGER', 'SALES') then
    raise exception 'not authorized to register sales';
  end if;

  select * into v_operation from public.sales_operations where id = p_operation_id for update;

  if not found or v_operation.organization_id <> v_org_id then
    raise exception 'operation not found';
  end if;

  if v_operation.status <> 'ABERTA' then
    raise exception 'operation is closed';
  end if;

  if p_customer_id is not null and not exists (
    select 1 from public.customers where id = p_customer_id and organization_id = v_org_id
  ) then
    raise exception 'customer not found';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'sale must have at least one item';
  end if;

  insert into public.orders (
    organization_id, order_type, channel, customer_id, status, operation_id,
    subtotal, discount, total, responsible_id
  ) values (
    v_org_id, 'SALE', p_channel, p_customer_id, 'ENTREGUE', p_operation_id,
    0, 0, 0, auth.uid()
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select sale_price into v_product_price
    from public.products
    where id = (v_item ->> 'product_id')::uuid and organization_id = v_org_id;

    if not found then
      raise exception 'product not found';
    end if;

    v_quantity := (v_item ->> 'quantity')::numeric;
    if v_quantity <= 0 then
      raise exception 'quantity must be positive';
    end if;

    v_unit_price := coalesce((v_item ->> 'unit_price')::numeric, v_product_price);

    v_subtotal := v_subtotal + v_quantity * v_unit_price;

    insert into public.order_items (order_id, product_id, quantity, unit_price)
    values (v_order_id, (v_item ->> 'product_id')::uuid, v_quantity, v_unit_price);
  end loop;

  perform set_config('prakaba.allow_order_totals_update', 'on', true);

  update public.orders
  set subtotal = v_subtotal, discount = 0, total = v_subtotal
  where id = v_order_id;

  perform public.register_payment(v_order_id, v_subtotal, p_payment_method);

  return v_order_id;
end;
$$;

grant execute on function public.create_sale(
  uuid, public.order_channel, uuid, public.payment_method, jsonb
) to authenticated;
