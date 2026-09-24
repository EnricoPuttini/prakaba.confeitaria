import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReportProfile } from "@/lib/reports/auth";
import { csvResponse, toCsv } from "@/lib/reports/csv";

export async function GET(request: NextRequest) {
  const profile = await getReportProfile();
  if (!profile) return new Response("Sem permissão.", { status: 403 });

  const activeOnly = request.nextUrl.searchParams.get("active") === "true";

  const supabase = await createClient();
  let customerQuery = supabase.from("customers").select("id, name, phone").order("name");
  if (activeOnly) {
    customerQuery = customerQuery.eq("active", true);
  }

  const { data: customers } = await customerQuery;
  const customerIds = (customers ?? []).map((c) => c.id);

  const { data: orders } = customerIds.length
    ? await supabase
        .from("orders")
        .select("customer_id, total, order_date")
        .in("customer_id", customerIds)
        .neq("status", "CANCELADA")
    : { data: [] as { customer_id: string | null; total: number; order_date: string }[] };

  const statsByCustomer = new Map<string, { count: number; total: number; lastPurchase: string | null }>();
  for (const order of orders ?? []) {
    if (!order.customer_id) continue;
    const current = statsByCustomer.get(order.customer_id) ?? { count: 0, total: 0, lastPurchase: null };
    current.count += 1;
    current.total += order.total;
    if (!current.lastPurchase || order.order_date > current.lastPurchase) {
      current.lastPurchase = order.order_date;
    }
    statsByCustomer.set(order.customer_id, current);
  }

  const rows = (customers ?? []).map((customer) => {
    const stats = statsByCustomer.get(customer.id);
    return [
      customer.name,
      customer.phone ?? "",
      stats?.count ?? 0,
      (stats?.total ?? 0).toFixed(2),
      stats?.lastPurchase ? new Date(stats.lastPurchase).toLocaleDateString("pt-BR") : "",
    ];
  });

  const csv = toCsv(["Cliente", "Telefone", "Pedidos", "Total gasto", "Última compra"], rows);

  return csvResponse("relatorio-clientes.csv", csv);
}
