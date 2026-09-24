import Link from "next/link";
import { History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOperationSummary } from "@/lib/operations/summary";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { OpenOperationForm } from "./open-operation-form";
import { CloseOperationForm } from "./close-operation-form";
import { OperationSummaryCard } from "./operation-summary-card";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function OperacoesPage() {
  const supabase = await createClient();

  const [{ data: openOperation }, { data: pastOperations }] = await Promise.all([
    supabase.from("sales_operations").select("*").eq("status", "ABERTA").maybeSingle(),
    supabase
      .from("sales_operations")
      .select("id, location, opened_at, closed_at, status")
      .eq("status", "FECHADA")
      .order("closed_at", { ascending: false })
      .limit(20),
  ]);

  const summary = openOperation ? await getOperationSummary(supabase, openOperation.id) : null;

  return (
    <>
      <PageHeader title="Operações" description="Abertura e fechamento de caixa para vendas presenciais." />

      {!openOperation ? (
        <div className="mb-6">
          <OpenOperationForm />
        </div>
      ) : (
        <>
          <div className="mb-6">
            <Card variant="alert" tone="primary">
              <CardHeader className="flex-row items-center gap-2">
                <CardTitle>Operação{openOperation.location ? ` — ${openOperation.location}` : ""}</CardTitle>
                <Badge tone="primary">Aberta</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 text-sm">
                <p className="text-secondary-foreground">
                  Aberta em {new Date(openOperation.opened_at).toLocaleString("pt-BR")} · Caixa inicial:{" "}
                  <span className="text-foreground">{formatCurrency(openOperation.opening_cash)}</span>
                </p>
                <CloseOperationForm operationId={openOperation.id} />
              </CardContent>
            </Card>
          </div>

          {summary && (
            <div className="mb-6">
              <OperationSummaryCard summary={summary} />
            </div>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de operações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pastOperations?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-secondary-foreground">
                    <th className="px-6 py-3 font-medium">Local</th>
                    <th className="px-6 py-3 font-medium">Aberta em</th>
                    <th className="px-6 py-3 font-medium">Fechada em</th>
                  </tr>
                </thead>
                <tbody>
                  {pastOperations.map((operation) => (
                    <tr key={operation.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                      <td className="px-6 py-3">
                        <Link
                          href={`/operacoes/${operation.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {operation.location ?? "Sem local"}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        {new Date(operation.opened_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        {operation.closed_at ? new Date(operation.closed_at).toLocaleString("pt-BR") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={History} title="Nenhuma operação encerrada ainda" />
          )}
        </CardContent>
      </Card>
    </>
  );
}
