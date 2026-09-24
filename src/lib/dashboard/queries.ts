import "server-only";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type DashboardCards = {
  revenue: number;
  salesCount: number;
  reservationsCount: number;
  averageTicket: number;
  pendingReservations: number;
  inProductionReservations: number;
  criticalStockCount: number;
  upcomingPayables: number;
  pendingReceivables: number;
};

export type DailyRevenuePoint = { date: string; revenue: number };
export type ChannelRevenuePoint = { channel: string; revenue: number };
export type PaymentMethodPoint = { method: string; amount: number };
export type TopProductPoint = { productName: string; quantity: number };

export type DashboardData = {
  cards: DashboardCards;
  dailyRevenue: DailyRevenuePoint[];
  revenueByChannel: ChannelRevenuePoint[];
  amountByPaymentMethod: PaymentMethodPoint[];
  topProducts: TopProductPoint[];
};

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getDashboardData(
  supabase: SupabaseServerClient,
  from: Date,
  to: Date,
  includeFinance: boolean,
): Promise<DashboardData> {
  const fromISO = from.toISOString();
  const toISO = to.toISOString();
  const today = toISODate(new Date());
  const weekAhead = toISODate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const [
    { data: ordersInRange },
    { count: pendingReservationsCount },
    { count: inProductionCount },
    { data: ingredients },
    { data: products },
    { data: paymentsInRange },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_type, channel, total, order_date")
      .neq("status", "CANCELADA")
      .gte("order_date", fromISO)
      .lte("order_date", toISO),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("order_type", "RESERVATION")
      .eq("status", "PENDENTE"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("order_type", "RESERVATION")
      .eq("status", "EM_PRODUCAO"),
    supabase.from("ingredients").select("current_stock, minimum_stock").eq("active", true),
    supabase.from("products").select("current_stock, minimum_stock").eq("active", true),
    supabase
      .from("payments")
      .select("amount, method, paid_at")
      .gte("paid_at", fromISO)
      .lte("paid_at", toISO),
  ]);

  const orderIds = (ordersInRange ?? []).map((order) => order.id);
  const { data: itemsInRange } = orderIds.length
    ? await supabase
        .from("order_items")
        .select("order_id, product_id, quantity")
        .in("order_id", orderIds)
    : { data: [] as { order_id: string; product_id: string; quantity: number }[] };

  const productIds = [...new Set((itemsInRange ?? []).map((item) => item.product_id))];
  const { data: productNames } = productIds.length
    ? await supabase.from("products").select("id, name").in("id", productIds)
    : { data: [] as { id: string; name: string }[] };
  const productNameById = new Map((productNames ?? []).map((p) => [p.id, p.name]));

  const revenue = (ordersInRange ?? []).reduce((sum, order) => sum + order.total, 0);
  const salesOrders = (ordersInRange ?? []).filter((order) => order.order_type === "SALE");
  const salesCount = salesOrders.length;
  const salesRevenue = salesOrders.reduce((sum, order) => sum + order.total, 0);
  const reservationsCount = (ordersInRange ?? []).filter((o) => o.order_type === "RESERVATION").length;

  const criticalStockCount =
    (ingredients ?? []).filter((i) => i.minimum_stock != null && i.current_stock < i.minimum_stock).length +
    (products ?? []).filter((p) => p.minimum_stock != null && p.current_stock < p.minimum_stock).length;

  let upcomingPayables = 0;
  let pendingReceivables = 0;

  if (includeFinance) {
    const [{ data: payables }, { data: receivables }, { data: openReservations }] = await Promise.all([
      supabase
        .from("accounts_payable")
        .select("amount")
        .eq("status", "PENDENTE")
        .gte("due_date", today)
        .lte("due_date", weekAhead),
      supabase.from("accounts_receivable").select("amount").eq("status", "PENDENTE"),
      supabase
        .from("orders")
        .select("id, total")
        .eq("order_type", "RESERVATION")
        .not("status", "in", "(ENTREGUE,CANCELADA)"),
    ]);

    upcomingPayables = (payables ?? []).reduce((sum, a) => sum + a.amount, 0);

    const openReservationIds = (openReservations ?? []).map((o) => o.id);
    const { data: openPayments } = openReservationIds.length
      ? await supabase.from("payments").select("order_id, amount").in("order_id", openReservationIds)
      : { data: [] as { order_id: string; amount: number }[] };

    const paidByOrder = new Map<string, number>();
    for (const payment of openPayments ?? []) {
      paidByOrder.set(payment.order_id, (paidByOrder.get(payment.order_id) ?? 0) + payment.amount);
    }
    const reservationBalance = (openReservations ?? []).reduce(
      (sum, order) => sum + Math.max(0, order.total - (paidByOrder.get(order.id) ?? 0)),
      0,
    );

    pendingReceivables =
      (receivables ?? []).reduce((sum, a) => sum + a.amount, 0) + reservationBalance;
  }

  const dailyRevenueMap = new Map<string, number>();
  for (const order of ordersInRange ?? []) {
    const day = order.order_date.slice(0, 10);
    dailyRevenueMap.set(day, (dailyRevenueMap.get(day) ?? 0) + order.total);
  }
  const dailyRevenue: DailyRevenuePoint[] = [...dailyRevenueMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rev]) => ({ date, revenue: rev }));

  const channelRevenueMap = new Map<string, number>();
  for (const order of ordersInRange ?? []) {
    channelRevenueMap.set(order.channel, (channelRevenueMap.get(order.channel) ?? 0) + order.total);
  }
  const revenueByChannel: ChannelRevenuePoint[] = [...channelRevenueMap.entries()].map(
    ([channel, rev]) => ({ channel, revenue: rev }),
  );

  const paymentMethodMap = new Map<string, number>();
  for (const payment of paymentsInRange ?? []) {
    paymentMethodMap.set(payment.method, (paymentMethodMap.get(payment.method) ?? 0) + payment.amount);
  }
  const amountByPaymentMethod: PaymentMethodPoint[] = [...paymentMethodMap.entries()].map(
    ([method, amount]) => ({ method, amount }),
  );

  const productQuantityMap = new Map<string, number>();
  for (const item of itemsInRange ?? []) {
    productQuantityMap.set(item.product_id, (productQuantityMap.get(item.product_id) ?? 0) + item.quantity);
  }
  const topProducts: TopProductPoint[] = [...productQuantityMap.entries()]
    .map(([productId, quantity]) => ({
      productName: productNameById.get(productId) ?? "Produto",
      quantity,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  return {
    cards: {
      revenue,
      salesCount,
      reservationsCount,
      averageTicket: salesCount ? salesRevenue / salesCount : 0,
      pendingReservations: pendingReservationsCount ?? 0,
      inProductionReservations: inProductionCount ?? 0,
      criticalStockCount,
      upcomingPayables,
      pendingReceivables,
    },
    dailyRevenue,
    revenueByChannel,
    amountByPaymentMethod,
    topProducts,
  };
}
