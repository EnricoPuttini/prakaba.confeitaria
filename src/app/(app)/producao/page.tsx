import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SuggestionsTable } from "./suggestions-table";

const STATUS_LABELS: Record<string, string> = {
  PLANEJADA: "Planejada",
  EM_PRODUCAO: "Em produção",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  PLANEJADA: "text-secondary-foreground",
  EM_PRODUCAO: "text-warning",
  CONCLUIDA: "text-success",
  CANCELADA: "text-error",
};

export default async function ProducaoPage() {
  const supabase = await createClient();

  const [{ data: orders }, { data: suggestions }] = await Promise.all([
    supabase
      .from("production_orders")
      .select("id, status, planned_date, created_at")
      .order("created_at", { ascending: false }),
    supabase.rpc("get_production_suggestions"),
  ]);

  return (
    <>
      <PageHeader
        title="Produção"
        description="Ordens de produção orientadas pela demanda de vendas e reservas."
      />

      <div className="mb-6">
        <SuggestionsTable suggestions={suggestions ?? []} />
      </div>

      <div className="mb-4 flex justify-end">
        <Button asChild>
          <Link href="/producao/novo">Nova ordem de produção</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-secondary-foreground">
                <th className="px-6 py-3 font-medium">Criada em</th>
                <th className="px-6 py-3 font-medium">Data planejada</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3">
                    <Link
                      href={`/producao/${order.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {new Date(order.created_at).toLocaleDateString("pt-BR")}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-secondary-foreground">
                    {order.planned_date
                      ? new Date(order.planned_date).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className={`px-6 py-3 font-medium ${STATUS_COLORS[order.status] ?? ""}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </td>
                </tr>
              ))}
              {!orders?.length && (
                <tr>
                  <td className="px-6 py-6 text-secondary-foreground" colSpan={3}>
                    Nenhuma ordem de produção cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
