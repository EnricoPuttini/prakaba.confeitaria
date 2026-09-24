import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOperationSummary } from "@/lib/operations/summary";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationSummaryCard } from "../operation-summary-card";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function OperacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: operation } = await supabase.from("sales_operations").select("*").eq("id", id).maybeSingle();

  if (!operation) {
    notFound();
  }

  const summary = await getOperationSummary(supabase, operation.id);

  return (
    <>
      <PageHeader
        title={operation.location ?? "Operação"}
        description={`Aberta em ${new Date(operation.opened_at).toLocaleString("pt-BR")}${
          operation.closed_at ? ` · Fechada em ${new Date(operation.closed_at).toLocaleString("pt-BR")}` : ""
        }`}
      />

      {operation.status === "FECHADA" && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Fechamento de caixa</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 divide-x divide-y divide-border rounded-md border border-border sm:grid-cols-4 sm:divide-y-0">
                <div className="p-4">
                  <p className="text-sm text-secondary-foreground">Caixa inicial</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCurrency(operation.opening_cash)}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-secondary-foreground">Esperado em dinheiro</p>
                  <p className="text-lg font-semibold text-foreground">
                    {operation.expected_cash != null ? formatCurrency(operation.expected_cash) : "—"}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-secondary-foreground">Contado</p>
                  <p className="text-lg font-semibold text-foreground">
                    {operation.closing_cash_counted != null
                      ? formatCurrency(operation.closing_cash_counted)
                      : "—"}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-secondary-foreground">Diferença</p>
                  <p
                    className={`text-lg font-semibold ${
                      operation.cash_difference && operation.cash_difference !== 0
                        ? "text-error"
                        : "text-success"
                    }`}
                  >
                    {operation.cash_difference != null ? formatCurrency(operation.cash_difference) : "—"}
                  </p>
                </div>
              </div>
              {operation.notes && <p className="text-xs text-secondary-foreground">{operation.notes}</p>}
            </CardContent>
          </Card>
        </div>
      )}

      <OperationSummaryCard summary={summary} />
    </>
  );
}
