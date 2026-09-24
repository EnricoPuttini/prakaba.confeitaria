import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReservationForm } from "../reservation-form";
import { saveReservation } from "../actions";
import { StatusSelect } from "./status-select";
import { PaymentForm } from "./payment-form";

const METHOD_LABELS: Record<string, string> = {
  PIX: "PIX",
  CARTAO: "Cartão",
  DINHEIRO: "Dinheiro",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function EditarReservaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: items }, { data: payments }, { data: products }, { data: customers }] =
    await Promise.all([
      supabase.from("orders").select("*").eq("id", id).maybeSingle(),
      supabase.from("order_items").select("product_id, quantity, unit_price").eq("order_id", id),
      supabase
        .from("payments")
        .select("id, amount, method, paid_at")
        .eq("order_id", id)
        .order("paid_at", { ascending: false }),
      supabase.from("products").select("id, name, sale_price").eq("active", true).order("name"),
      supabase.from("customers").select("id, name").eq("active", true).order("name"),
    ]);

  if (!order) {
    notFound();
  }

  const totalPaid = (payments ?? []).reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = order.total - totalPaid;

  return (
    <>
      <PageHeader title={`Reserva #${order.order_number}`} description="Editar reserva." />

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary-foreground">Status:</span>
          <StatusSelect orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-secondary-foreground">Total do pedido</p>
                <p className="text-lg font-semibold text-foreground">{formatCurrency(order.total)}</p>
              </div>
              <div>
                <p className="text-secondary-foreground">Valor pago</p>
                <p className="text-lg font-semibold text-success">{formatCurrency(totalPaid)}</p>
              </div>
              <div>
                <p className="text-secondary-foreground">Restante</p>
                <p className={`text-lg font-semibold ${remaining > 0 ? "text-error" : "text-success"}`}>
                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>

            {remaining > 0 && <PaymentForm orderId={order.id} />}

            {payments && payments.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-secondary-foreground">
                    <th className="py-2 font-medium">Data</th>
                    <th className="py-2 font-medium">Forma</th>
                    <th className="py-2 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border last:border-0">
                      <td className="py-2 text-secondary-foreground">
                        {new Date(payment.paid_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-2 text-foreground">{METHOD_LABELS[payment.method] ?? payment.method}</td>
                      <td className="py-2 text-foreground">{formatCurrency(payment.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <ReservationForm
        products={products ?? []}
        customers={customers ?? []}
        action={saveReservation.bind(null, order.id)}
        initialReservation={{
          customerId: order.customer_id ?? "",
          channel: order.channel,
          scheduledAt: order.scheduled_at,
          discount: order.discount,
          notes: order.notes,
          items: (items ?? []).map((item) => ({
            productId: item.product_id,
            quantity: item.quantity,
            unitPrice: item.unit_price,
          })),
        }}
      />
    </>
  );
}
