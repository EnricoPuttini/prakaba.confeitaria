-- PRAKABÁ V1 — Fase 3: criação/edição atômica de reservas e registro de
-- pagamentos, com as mesmas travas de integridade usadas em produção
-- (Fase 2): nenhuma escrita parcial, nenhum valor inconsistente.

create or replace function public.save_reservation(
  p_order_id uuid,
  p_customer_id uuid,
  p_channel public.order_channel,
  p_scheduled_at timestamptz,
  p_discount numeric,
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
    raise exception 'not authorized to manage reservations';
  end if;

  if p_customer_id is null then
    raise exception 'customer is required for a reservation';
  end if;

  if not exists (
    select 1 from public.customers
    where id = p_customer_id and organization_id = v_org_id
  ) then
    raise exception 'customer not found';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'reservation must have at least one item';
  end if;

  if p_order_id is null then
    insert into public.orders (
      organization_id, order_type, channel, customer_id, status,
      scheduled_at, subtotal, discount, total, notes, responsible_id
    ) values (
      v_org_id, 'RESERVATION', p_channel, p_customer_id, 'PENDENTE',
      p_scheduled_at, 0, 0, 0, p_notes, auth.uid()
    )
    returning id into v_order_id;
  else
    update public.orders
    set channel = p_channel,
        customer_id = p_customer_id,
        scheduled_at = p_scheduled_at,
        notes = p_notes
    where id = p_order_id
      and organization_id = v_org_id
      and order_type = 'RESERVATION'
    returning id into v_order_id;

    if v_order_id is null then
      raise exception 'reservation not found';
    end if;

    delete from public.order_items where order_id = v_order_id;
  end if;

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
    if v_unit_price < 0 then
      raise exception 'unit_price cannot be negative';
    end if;

    v_subtotal := v_subtotal + v_quantity * v_unit_price;

    insert into public.order_items (order_id, product_id, quantity, unit_price)
    values (v_order_id, (v_item ->> 'product_id')::uuid, v_quantity, v_unit_price);
  end loop;

  if p_discount < 0 or p_discount > v_subtotal then
    raise exception 'invalid discount';
  end if;

  perform set_config('prakaba.allow_order_totals_update', 'on', true);

  update public.orders
  set subtotal = v_subtotal,
      discount = p_discount,
      total = v_subtotal - p_discount
  where id = v_order_id;

  return v_order_id;
end;
$$;

grant execute on function public.save_reservation(
  uuid, uuid, public.order_channel, timestamptz, numeric, text, jsonb
) to authenticated;

create or replace function public.register_payment(
  p_order_id uuid,
  p_amount numeric,
  p_method public.payment_method
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_role public.user_role;
  v_order public.orders%rowtype;
  v_paid numeric;
  v_payment_id uuid;
begin
  v_org_id := public.get_my_organization_id();
  v_role := public.get_my_role();

  if v_org_id is null then
    raise exception 'not authenticated';
  end if;

  if v_role not in ('OWNER', 'MANAGER', 'SALES', 'FINANCE') then
    raise exception 'not authorized to register payments';
  end if;

  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;

  if not found or v_order.organization_id <> v_org_id then
    raise exception 'order not found';
  end if;

  select coalesce(sum(amount), 0) into v_paid
  from public.payments
  where order_id = p_order_id;

  if v_paid + p_amount > v_order.total then
    raise exception 'payment exceeds order total';
  end if;

  insert into public.payments (organization_id, order_id, amount, method)
  values (v_org_id, p_order_id, p_amount, p_method)
  returning id into v_payment_id;

  return v_payment_id;
end;
$$;

grant execute on function public.register_payment(uuid, numeric, public.payment_method) to authenticated;
