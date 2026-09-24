import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  CONFIRMADA: "Confirmada",
  EM_PRODUCAO: "Em produção",
  PRONTA: "Pronta",
  ENTREGUE: "Entregue",
  CANCELADA: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: "text-secondary-foreground",
  CONFIRMADA: "text-primary",
  EM_PRODUCAO: "text-warning",
  PRONTA: "text-warning",
  ENTREGUE: "text-success",
  CANCELADA: "text-error",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ReservasPage() {
  const supabase = await createClient();

  const [{ data: orders }, { data: customers }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, customer_id, order_date, scheduled_at, status, total")
      .eq("order_type", "RESERVATION")
      .order("order_date", { ascending: false }),
    supabase.from("customers").select("id, name"),
  ]);

  const customerNameById = new Map((customers ?? []).map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader title="Reservas" description="Pedidos reservados e encomendas da PRAKABÁ." />

      <div className="mb-4 flex justify-end">
        <Button asChild>
          <Link href="/reservas/novo">Nova reserva</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-secondary-foreground">
                <th className="px-6 py-3 font-medium">Número</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Retirada/entrega</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3">
                    <Link
                      href={`/reservas/${order.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      #{order.order_number}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-secondary-foreground">
                    {(order.customer_id && customerNameById.get(order.customer_id)) ?? "—"}
                  </td>
                  <td className="px-6 py-3 text-secondary-foreground">
                    {order.scheduled_at ? new Date(order.scheduled_at).toLocaleString("pt-BR") : "—"}
                  </td>
                  <td className={`px-6 py-3 font-medium ${STATUS_COLORS[order.status] ?? ""}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </td>
                  <td className="px-6 py-3 text-foreground">{formatCurrency(order.total)}</td>
                </tr>
              ))}
              {!orders?.length && (
                <tr>
                  <td className="px-6 py-6 text-secondary-foreground" colSpan={5}>
                    Nenhuma reserva cadastrada ainda.
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
