import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "../product-form";
import { CategoryForm } from "../category-form";
import { createProduct } from "../actions";

export default async function NovoProdutoPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("product_categories")
    .select("id, name")
    .eq("active", true)
    .order("name");

  return (
    <>
      <PageHeader title="Novo produto" description="Cadastre um novo item do catálogo da PRAKABÁ." />

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryForm />
          </CardContent>
        </Card>
      </div>

      <ProductForm categories={categories ?? []} action={createProduct} submitLabel="Criar produto" />
    </>
  );
}
