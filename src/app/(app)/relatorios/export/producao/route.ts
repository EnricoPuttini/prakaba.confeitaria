import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReportProfile } from "@/lib/reports/auth";
import { resolveDateRange, type DateRangePreset } from "@/lib/reports/date-range";
import { csvResponse, toCsv } from "@/lib/reports/csv";

const STATUS_LABELS: Record<string, string> = {
  PLANEJADA: "Planejada",
  EM_PRODUCAO: "Em produção",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export async function GET(request: NextRequest) {
  const profile = await getReportProfile();
  if (!profile) return new Response("Sem permissão.", { status: 403 });

  const params = request.nextUrl.searchParams;
  const preset = (params.get("period") as DateRangePreset) || "30dias";
  const { from, to } = resolveDateRange(preset, params.get("from"), params.get("to"));

  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("production_orders")
    .select("id, status, planned_date, created_at")
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString());

  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: items } = orderIds.length
    ? await supabase
        .from("production_items")
        .select("production_order_id, product_id, planned_quantity, produced_quantity")
        .in("production_order_id", orderIds)
    : { data: [] as { production_order_id: string; product_id: string; planned_quantity: number; produced_quantity: number | null }[] };

  const productIds = [...new Set((items ?? []).map((item) => item.product_id))];
  const { data: products } = productIds.length
    ? await supabase.from("products").select("id, name").in("id", productIds)
    : { data: [] as { id: string; name: string }[] };
  const productNameById = new Map((products ?? []).map((p) => [p.id, p.name]));

  const orderById = new Map((orders ?? []).map((order) => [order.id, order]));

  const rows = (items ?? []).map((item) => {
    const order = orderById.get(item.production_order_id);
    return [
      productNameById.get(item.product_id) ?? "",
      item.produced_quantity ?? item.planned_quantity,
      order ? new Date(order.created_at).toLocaleDateString("pt-BR") : "",
      order ? STATUS_LABELS[order.status] ?? order.status : "",
    ];
  });

  const csv = toCsv(["Produto", "Quantidade", "Data", "Status"], rows);

  return csvResponse("relatorio-producao.csv", csv);
}
