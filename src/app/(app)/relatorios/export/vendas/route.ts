import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReportProfile } from "@/lib/reports/auth";
import { resolveDateRange, type DateRangePreset } from "@/lib/reports/date-range";
import { csvResponse, toCsv } from "@/lib/reports/csv";

const CHANNEL_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  RESERVA: "Reserva",
  IFOOD: "iFood",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  OUTRO: "Outro",
};

const METHOD_LABELS: Record<string, string> = { PIX: "PIX", CARTAO: "Cartão", DINHEIRO: "Dinheiro" };

export async function GET(request: NextRequest) {
  const profile = await getReportProfile();
  if (!profile) return new Response("Sem permissão.", { status: 403 });

  const params = request.nextUrl.searchParams;
  const preset = (params.get("period") as DateRangePreset) || "30dias";
  const orderTypeFilter = params.get("orderType") || "ALL";
  const { from, to } = resolveDateRange(preset, params.get("from"), params.get("to"));

  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("id, order_number, order_date, channel, order_type, status, operation_id")
    .neq("status", "CANCELADA")
    .gte("order_date", from.toISOString())
    .lte("order_date", to.toISOString());

  if (orderTypeFilter === "SALE" || orderTypeFilter === "RESERVATION") {
    query = query.eq("order_type", orderTypeFilter);
  }

  const { data: orders } = await query;
  const orderIds = (orders ?? []).map((o) => o.id);

  const [{ data: items }, { data: payments }, { data: operations }] = await Promise.all([
    orderIds.length
      ? supabase.from("order_items").select("order_id, product_id, quantity, unit_price").in("order_id", orderIds)
      : Promise.resolve({ data: [] as { order_id: string; product_id: string; quantity: number; unit_price: number }[] }),
    orderIds.length
      ? supabase.from("payments").select("order_id, method").in("order_id", orderIds)
      : Promise.resolve({ data: [] as { order_id: string; method: string }[] }),
    supabase.from("sales_operations").select("id, location"),
  ]);

  const productIds = [...new Set((items ?? []).map((item) => item.product_id))];
  const { data: products } = productIds.length
    ? await supabase.from("products").select("id, name").in("id", productIds)
    : { data: [] as { id: string; name: string }[] };

  const productNameById = new Map((products ?? []).map((p) => [p.id, p.name]));
  const operationLocationById = new Map((operations ?? []).map((op) => [op.id, op.location ?? "—"]));

  const methodsByOrder = new Map<string, Set<string>>();
  for (const payment of payments ?? []) {
    if (!methodsByOrder.has(payment.order_id)) methodsByOrder.set(payment.order_id, new Set());
    methodsByOrder.get(payment.order_id)!.add(METHOD_LABELS[payment.method] ?? payment.method);
  }

  const orderById = new Map((orders ?? []).map((order) => [order.id, order]));

  const rows = (items ?? []).map((item) => {
    const order = orderById.get(item.order_id);
    return [
      order?.order_number ?? "",
      order ? new Date(order.order_date).toLocaleDateString("pt-BR") : "",
      order ? CHANNEL_LABELS[order.channel] ?? order.channel : "",
      order?.operation_id ? operationLocationById.get(order.operation_id) ?? "" : "",
      productNameById.get(item.product_id) ?? "",
      item.quantity,
      (item.quantity * item.unit_price).toFixed(2),
      [...(methodsByOrder.get(item.order_id) ?? [])].join(", "),
    ];
  });

  const csv = toCsv(
    ["Número", "Data", "Canal", "Operação", "Produto", "Quantidade", "Valor", "Pagamento"],
    rows,
  );

  return csvResponse("relatorio-vendas.csv", csv);
}
