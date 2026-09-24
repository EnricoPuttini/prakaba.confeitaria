import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReportProfile } from "@/lib/reports/auth";
import { csvResponse, toCsv } from "@/lib/reports/csv";
import { UNIT_LABELS, type unitOptions } from "@/lib/validations/units";

export async function GET(request: NextRequest) {
  const profile = await getReportProfile();
  if (!profile) return new Response("Sem permissão.", { status: 403 });

  const kindFilter = request.nextUrl.searchParams.get("kind") || "ALL";

  const supabase = await createClient();
  let query = supabase
    .from("ingredients")
    .select("name, current_stock, minimum_stock, unit, cost_per_unit, kind")
    .eq("active", true)
    .order("name");

  if (kindFilter === "INGREDIENTE" || kindFilter === "INSUMO") {
    query = query.eq("kind", kindFilter);
  }

  const { data: ingredients } = await query;

  const rows = (ingredients ?? []).map((item) => [
    item.name,
    item.current_stock,
    item.minimum_stock ?? "",
    UNIT_LABELS[item.unit as (typeof unitOptions)[number]] ?? item.unit,
    item.cost_per_unit.toFixed(4),
  ]);

  const csv = toCsv(["Item", "Estoque", "Mínimo", "Unidade", "Custo"], rows);

  return csvResponse("relatorio-estoque.csv", csv);
}
