import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "../product-form";
import { updateProduct } from "../actions";
import { ActiveToggle } from "./active-toggle";
import { RecipeSection } from "./recipe-section";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }, { data: cost }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("product_categories").select("id, name").eq("active", true).order("name"),
    supabase.rpc("calculate_product_cost", { p_product_id: id }),
  ]);

  if (!product) {
    notFound();
  }

  const margin = cost != null ? product.sale_price - cost : null;
  const marginPercent = cost != null && product.sale_price > 0 ? (margin! / product.sale_price) * 100 : null;

  return (
    <>
      <PageHeader title={product.name} description="Editar produto." />

      <div className="mb-6 flex items-center justify-between">
        <ActiveToggle productId={product.id} active={product.active} />
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Custo e margem</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-secondary-foreground">Custo por unidade</p>
              <p className="text-lg font-semibold text-foreground">
                {cost != null ? formatCurrency(cost) : "—"}
              </p>
            </div>
            <div>
              <p className="text-secondary-foreground">Margem</p>
              <p className="text-lg font-semibold text-foreground">
                {margin != null ? formatCurrency(margin) : "—"}
              </p>
            </div>
            <div>
              <p className="text-secondary-foreground">Margem (%)</p>
              <p className="text-lg font-semibold text-foreground">
                {marginPercent != null ? `${marginPercent.toFixed(1)}%` : "—"}
              </p>
            </div>
            {cost == null && (
              <p className="col-span-3 text-xs text-secondary-foreground">
                Cadastre a ficha técnica abaixo para calcular o custo automaticamente.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <ProductForm
          categories={categories ?? []}
          action={updateProduct.bind(null, product.id)}
          submitLabel="Salvar alterações"
          initialValues={{
            name: product.name,
            categoryId: product.category_id,
            sku: product.sku,
            description: product.description,
            salePrice: product.sale_price,
            saleUnit: product.sale_unit,
            minimumStock: product.minimum_stock,
            productionTimeMinutes: product.production_time_minutes,
            shelfLifeDays: product.shelf_life_days,
          }}
        />
      </div>

      <RecipeSection productId={product.id} />
    </>
  );
}
