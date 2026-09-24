import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <CardContent className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-secondary-foreground">Pedidos</p>
              <p className="text-lg font-semibold text-foreground">{validOrders.length}</p>
            </div>
            <div>
              <p className="text-secondary-foreground">Total gasto</p>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(totalSpent)}</p>
            </div>
            <div>
              <p className="text-secondary-foreground">Última compra</p>
              <p className="text-lg font-semibold text-foreground">
                {lastPurchase ? new Date(lastPurchase).toLocaleDateString("pt-BR") : "—"}
              </p>
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
                    {new Date(order.order_date).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-3 text-foreground">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </td>
                  <td className="px-6 py-3 text-foreground">{formatCurrency(order.total)}</td>
                </tr>
              ))}
              {!orders?.length && (
                <tr>
                  <td className="px-6 py-6 text-secondary-foreground" colSpan={4}>
                    Nenhum pedido ainda.
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
