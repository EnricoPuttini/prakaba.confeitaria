import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReportProfile } from "@/lib/reports/auth";
import { resolveDateRange, type DateRangePreset } from "@/lib/reports/date-range";
import { csvResponse, toCsv } from "@/lib/reports/csv";

export async function GET(request: NextRequest) {
  const profile = await getReportProfile();
  if (!profile) return new Response("Sem permissão.", { status: 403 });

  const params = request.nextUrl.searchParams;
  const preset = (params.get("period") as DateRangePreset) || "30dias";
  const { from, to } = resolveDateRange(preset, params.get("from"), params.get("to"));
  const fromDate = from.toISOString().slice(0, 10);
  const toDate = to.toISOString().slice(0, 10);

  const supabase = await createClient();

  const [{ data: payables }, { data: receivables }] = await Promise.all([
    supabase
      .from("accounts_payable")
      .select("description, amount, paid_at, category_id")
      .eq("status", "PAGO")
      .gte("paid_at", fromDate)
      .lte("paid_at", toDate),
    supabase
      .from("accounts_receivable")
      .select("description, amount, paid_at")
      .eq("status", "PAGO")
      .gte("paid_at", fromDate)
      .lte("paid_at", toDate),
  ]);

  const categoryIds = [...new Set((payables ?? []).map((p) => p.category_id).filter(Boolean))] as string[];
  const { data: categories } = categoryIds.length
    ? await supabase.from("financial_categories").select("id, name").in("id", categoryIds)
    : { data: [] as { id: string; name: string }[] };
  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const rows = [
    ...(receivables ?? []).map((r) => [
      "Entrada",
      "Recebimento",
      r.paid_at ? new Date(r.paid_at).toLocaleDateString("pt-BR") : "",
      r.amount.toFixed(2),
    ]),
    ...(payables ?? []).map((p) => [
      "Saída",
      (p.category_id && categoryNameById.get(p.category_id)) || "Sem categoria",
      p.paid_at ? new Date(p.paid_at).toLocaleDateString("pt-BR") : "",
      p.amount.toFixed(2),
    ]),
  ];

  const csv = toCsv(["Tipo", "Categoria", "Data", "Valor"], rows);

  return csvResponse("relatorio-financeiro.csv", csv);
}
