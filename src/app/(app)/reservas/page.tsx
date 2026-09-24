import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { orderStatuses } from "@/lib/validations/reservation";
import type { VariantProps } from "class-variance-authority";

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  CONFIRMADA: "Confirmada",
  EM_PRODUCAO: "Em produção",
  PRONTA: "Pronta",
  ENTREGUE: "Entregue",
  CANCELADA: "Cancelada",
};

const STATUS_TONES: Record<string, NonNullable<VariantProps<typeof badgeVariants>["tone"]>> = {
  PENDENTE: "neutral",
  CONFIRMADA: "primary",
  EM_PRODUCAO: "warning",
  PRONTA: "warning",
  ENTREGUE: "success",
  CANCELADA: "error",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus: (typeof orderStatuses)[number] | null =
    status && orderStatuses.includes(status as (typeof orderStatuses)[number])
      ? (status as (typeof orderStatuses)[number])
      : null;

  const supabase = await createClient();

  let orderQuery = supabase
    .from("orders")
    .select("id, order_number, customer_id, order_date, scheduled_at, status, total")
    .eq("order_type", "RESERVATION")
    .order("order_date", { ascending: false });

  if (activeStatus) {
    orderQuery = orderQuery.eq("status", activeStatus);
  }

  const [{ data: orders }, { data: customers }] = await Promise.all([
    orderQuery,
    supabase.from("customers").select("id, name"),
  ]);

  const customerNameById = new Map((customers ?? []).map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader title="Reservas" description="Pedidos reservados e encomendas da PRAKABÁ." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/reservas"
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              !activeStatus
                ? "bg-primary text-primary-foreground"
                : "bg-surface-muted text-secondary-foreground hover:bg-primary-subtle",
            )}
          >
            Todas
          </Link>
          {orderStatuses.map((option) => (
            <Link
              key={option}
              href={`/reservas?status=${option}`}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                activeStatus === option
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-muted text-secondary-foreground hover:bg-primary-subtle",
              )}
            >
              {STATUS_LABELS[option]}
            </Link>
          ))}
        </div>

        <Button asChild>
          <Link href="/reservas/novo">Nova reserva</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {orders?.length ? (
            <div className="overflow-x-auto">
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
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
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
                      <td className="px-6 py-3">
                        <Badge tone={STATUS_TONES[order.status] ?? "neutral"}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-foreground">{formatCurrency(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={CalendarClock}
              title={activeStatus ? "Nenhuma reserva com esse status" : "Nenhuma reserva cadastrada ainda"}
              description={
                activeStatus
                  ? "Tente outro filtro ou crie uma nova reserva."
                  : "Cadastre a primeira reserva para começar a acompanhar encomendas."
              }
              action={
                <Button asChild variant="secondary" size="sm">
                  <Link href="/reservas/novo">Nova reserva</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
