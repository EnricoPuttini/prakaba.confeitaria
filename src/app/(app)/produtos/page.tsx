import Link from "next/link";
import { Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { UNIT_LABELS, type unitOptions } from "@/lib/validations/units";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ProdutosPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, sku, sale_price, sale_unit, active, category_id")
      .order("name"),
    supabase.from("product_categories").select("id, name"),
  ]);

  const categoryNameById = new Map((categories ?? []).map((category) => [category.id, category.name]));

  return (
    <>
      <PageHeader title="Produtos" description="Catálogo de produtos vendidos pela PRAKABÁ." />

      <div className="mb-4 flex justify-end">
        <Button asChild>
          <Link href="/produtos/novo">Novo produto</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {products?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-secondary-foreground">
                    <th className="px-6 py-3 font-medium">Nome</th>
                    <th className="px-6 py-3 font-medium">Categoria</th>
                    <th className="px-6 py-3 font-medium">Preço</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                      <td className="px-6 py-3">
                        <Link
                          href={`/produtos/${product.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {product.name}
                        </Link>
                        {product.sku && (
                          <span className="ml-2 text-xs text-secondary-foreground">{product.sku}</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        {(product.category_id && categoryNameById.get(product.category_id)) ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-foreground">
                        {formatCurrency(product.sale_price)} /{" "}
                        {UNIT_LABELS[product.sale_unit as (typeof unitOptions)[number]]}
                      </td>
                      <td className="px-6 py-3">
                        <Badge tone={product.active ? "success" : "neutral"}>
                          {product.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="Nenhum produto cadastrado ainda"
              description="Cadastre o primeiro produto do catálogo da PRAKABÁ."
              action={
                <Button asChild variant="secondary" size="sm">
                  <Link href="/produtos/novo">Novo produto</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
