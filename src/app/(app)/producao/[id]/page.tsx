import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionOrderForm } from "../production-order-form";
import { saveProductionOrder } from "../actions";
import { StartButton, CancelButton } from "./order-actions";
import { CompleteForm } from "./complete-form";

const STATUS_LABELS: Record<string, string> = {
  PLANEJADA: "Planejada",
  EM_PRODUCAO: "Em produção",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export default async function ProducaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: items }, { data: allProducts }] = await Promise.all([
    supabase.from("production_orders").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("production_items")
      .select("product_id, planned_quantity, produced_quantity")
      .eq("production_order_id", id),
    supabase.from("products").select("id, name").eq("active", true).order("name"),
  ]);

  if (!order) {
    notFound();
  }

  const productNameById = new Map((allProducts ?? []).map((p) => [p.id, p.name]));
  const itemsWithNames = (items ?? []).map((item) => ({
    productId: item.product_id,
    productName: productNameById.get(item.product_id) ?? "Produto",
    plannedQuantity: item.planned_quantity,
    producedQuantity: item.produced_quantity,
  }));

  return (
    <>
      <PageHeader
        title={`Ordem de produção — ${STATUS_LABELS[order.status] ?? order.status}`}
        description={
          order.planned_date
            ? `Planejada para ${new Date(order.planned_date).toLocaleDateString("pt-BR")}`
            : undefined
        }
      />

      <div className="mb-6 flex gap-2">
        {order.status === "PLANEJADA" && <StartButton orderId={order.id} />}
        {(order.status === "PLANEJADA" || order.status === "EM_PRODUCAO") && (
          <CancelButton orderId={order.id} />
        )}
      </div>

      {order.status === "PLANEJADA" && (
        <ProductionOrderForm
          products={allProducts ?? []}
          action={saveProductionOrder.bind(null, order.id)}
          submitLabel="Salvar alterações"
          initialOrder={{
            plannedDate: order.planned_date,
            notes: order.notes,
            items: itemsWithNames.map((item) => ({
              productId: item.productId,
              plannedQuantity: item.plannedQuantity,
            })),
          }}
        />
      )}

      {order.status === "EM_PRODUCAO" && <CompleteForm orderId={order.id} items={itemsWithNames} />}

      {(order.status === "CONCLUIDA" || order.status === "CANCELADA") && (
        <Card>
          <CardHeader>
            <CardTitle>Itens</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-secondary-foreground">
                  <th className="px-6 py-3 font-medium">Produto</th>
                  <th className="px-6 py-3 font-medium">Planejado</th>
                  <th className="px-6 py-3 font-medium">Produzido</th>
                </tr>
              </thead>
              <tbody>
                {itemsWithNames.map((item) => (
                  <tr key={item.productId} className="border-b border-border last:border-0">
                    <td className="px-6 py-3 text-foreground">{item.productName}</td>
                    <td className="px-6 py-3 text-secondary-foreground">{item.plannedQuantity}</td>
                    <td className="px-6 py-3 text-secondary-foreground">
                      {item.producedQuantity ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
