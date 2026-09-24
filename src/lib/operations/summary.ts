import "server-only";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type OperationSummary = {
  salesCount: number;
  itemsCount: number;
  revenue: number;
  averageTicket: number;
  byPaymentMethod: Record<string, number>;
  byChannel: Record<string, number>;
};

export async function getOperationSummary(
  supabase: SupabaseServerClient,
  operationId: string,
): Promise<OperationSummary> {
  const { data: orders } = await supabase
    .from("orders")
    .select("id, total, channel")
    .eq("operation_id", operationId)
    .neq("status", "CANCELADA");

  const orderIds = (orders ?? []).map((order) => order.id);

  const [{ data: items }, { data: payments }] = await Promise.all([
    orderIds.length
      ? supabase.from("order_items").select("order_id, quantity").in("order_id", orderIds)
      : Promise.resolve({ data: [] as { order_id: string; quantity: number }[] }),
    orderIds.length
      ? supabase.from("payments").select("amount, method").in("order_id", orderIds)
      : Promise.resolve({ data: [] as { amount: number; method: string }[] }),
  ]);

  const revenue = (orders ?? []).reduce((sum, order) => sum + order.total, 0);
  const itemsCount = (items ?? []).reduce((sum, item) => sum + item.quantity, 0);

  const byPaymentMethod: Record<string, number> = {};
  for (const payment of payments ?? []) {
    byPaymentMethod[payment.method] = (byPaymentMethod[payment.method] ?? 0) + payment.amount;
  }

  const byChannel: Record<string, number> = {};
  for (const order of orders ?? []) {
    byChannel[order.channel] = (byChannel[order.channel] ?? 0) + order.total;
  }

  const salesCount = orders?.length ?? 0;

  return {
    salesCount,
    itemsCount,
    revenue,
    averageTicket: salesCount ? revenue / salesCount : 0,
    byPaymentMethod,
    byChannel,
  };
}
