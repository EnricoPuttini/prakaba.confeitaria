import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { IngredientForm } from "../ingredient-form";
import { createIngredient } from "../actions";

export default async function NovoItemEstoquePage() {
  const supabase = await createClient();
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("active", true)
    .order("name");

  return (
    <>
      <PageHeader
        title="Novo item de estoque"
        description="Cadastre um ingrediente ou insumo controlado pelo estoque."
      />
      <IngredientForm suppliers={suppliers ?? []} action={createIngredient} submitLabel="Criar item" />
    </>
  );
}
