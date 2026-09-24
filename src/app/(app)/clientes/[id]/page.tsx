import Link from "next/link";
import { notFound } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { VariantProps } from "class-variance-authority";
import { CustomerForm } from "../customer-form";
import { updateCustomer } from "../actions";
import { ActiveToggle } from "./active-toggle";

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

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: customer }, { data: orders }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("orders")
      .select("id, order_number, order_date, status, total")
      .eq("customer_id", id)
      .order("order_date", { ascending: false }),
  ]);

  if (!customer) {
    notFound();
  }

  const validOrders = (orders ?? []).filter((order) => order.status !== "CANCELADA");
  const totalSpent = validOrders.reduce((sum, order) => sum + order.total, 0);
  const lastPurchase = validOrders[0]?.order_date;

  return (
    <>
      <PageHeader title={customer.name} description="Editar cliente." />

      <div className="mb-6 flex items-center justify-between">
        <ActiveToggle customerId={customer.id} active={customer.active} />
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 divide-y divide-border rounded-md border border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="p-4">
                <p className="text-sm text-secondary-foreground">Pedidos</p>
                <p className="text-lg font-semibold text-foreground">{validOrders.length}</p>
              </div>
              <div className="p-4">
                <p className="text-sm text-secondary-foreground">Total gasto</p>
                <p className="text-lg font-semibold text-foreground">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="p-4">
                <p className="text-sm text-secondary-foreground">Última compra</p>
                <p className="text-lg font-semibold text-foreground">
                  {lastPurchase ? new Date(lastPurchase).toLocaleDateString("pt-BR") : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <CustomerForm
          action={updateCustomer.bind(null, customer.id)}
          submitLabel="Salvar alterações"
          initialValues={{
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            birthDate: customer.birth_date,
            notes: customer.notes,
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {orders?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-secondary-foreground">
                    <th className="px-6 py-3 font-medium">Número</th>
                    <th className="px-6 py-3 font-medium">Data</th>
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
                        {new Date(order.order_date).toLocaleDateString("pt-BR")}
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
            <EmptyState icon={ShoppingBag} title="Nenhum pedido ainda" />
          )}
        </CardContent>
      </Card>
    </>
  );
}
