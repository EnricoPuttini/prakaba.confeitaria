import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { ProductionOrderForm } from "../production-order-form";
import { saveProductionOrder } from "../actions";

export default async function NovaProducaoPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string; quantity?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("active", true)
    .order("name");

  const initialOrder =
    params.productId && params.quantity
      ? {
          plannedDate: null,
          notes: null,
          items: [{ productId: params.productId, plannedQuantity: Number(params.quantity) }],
        }
      : undefined;

  return (
    <>
      <PageHeader title="Nova ordem de produção" description="Planeje uma nova produção." />
      <ProductionOrderForm
        products={products ?? []}
        action={saveProductionOrder.bind(null, null)}
        initialOrder={initialOrder}
        submitLabel="Criar ordem"
      />
    </>
  );
}
