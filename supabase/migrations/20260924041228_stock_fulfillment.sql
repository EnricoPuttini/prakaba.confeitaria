-- PRAKABÁ V1 — Fase 5: baixa do estoque físico de produtos na entrega.
--
-- Venda presencial (order_type = 'SALE') é entrega imediata: a baixa
-- acontece dentro de create_sale(), no mesmo laço que insere os itens
-- (um trigger AFTER INSERT não veria os order_items ainda, pois eles só
-- existem depois que a linha de orders já foi inserida).
--
-- Reserva entregue (mudança de status para 'ENTREGUE') é tratada por um
-- trigger, pois pode acontecer bem depois da criação do pedido.
--
-- Em ambos os casos o estoque de produto acabado NUNCA bloqueia a
-- operação — diferente do estoque de ingredientes, ele é só um indicador
-- para alertas (seção 20), não uma trava física de compra.

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
  v_product_id uuid;
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
    v_product_id := (v_item ->> 'product_id')::uuid;

    select sale_price into v_product_price
    from public.products
    where id = v_product_id and organization_id = v_org_id;

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
    values (v_order_id, v_product_id, v_quantity, v_unit_price);

    update public.products
    set current_stock = current_stock - v_quantity
    where id = v_product_id;
  end loop;

  perform set_config('prakaba.allow_order_totals_update', 'on', true);

  update public.orders
  set subtotal = v_subtotal, discount = 0, total = v_subtotal
  where id = v_order_id;

  perform public.register_payment(v_order_id, v_subtotal, p_payment_method);

  return v_order_id;
end;
$$;

create or replace function public.deliver_order_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'ENTREGUE' and old.status is distinct from 'ENTREGUE' then
    update public.products p
    set current_stock = p.current_stock - oi.quantity
    from public.order_items oi
    where oi.order_id = new.id and oi.product_id = p.id;
  end if;
  return new;
end;
$$;

create trigger orders_deliver_items_on_update
  after update on public.orders
  for each row execute function public.deliver_order_items();
