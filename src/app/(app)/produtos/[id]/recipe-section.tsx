import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeForm } from "./recipe-form";

export async function RecipeSection({ productId }: { productId: string }) {
  const supabase = await createClient();

  const [{ data: ingredients }, { data: recipe }] = await Promise.all([
    supabase.from("ingredients").select("id, name, unit").eq("active", true).order("name"),
    supabase.from("recipes").select("id, yield_quantity, additional_cost, notes").eq("product_id", productId).maybeSingle(),
  ]);

  let initialRecipe = null;
  if (recipe) {
    const { data: items } = await supabase
      .from("recipe_items")
      .select("ingredient_id, quantity, unit")
      .eq("recipe_id", recipe.id);

    initialRecipe = {
      yieldQuantity: recipe.yield_quantity,
      additionalCost: recipe.additional_cost,
      notes: recipe.notes,
      items: (items ?? []).map((item) => ({
        ingredientId: item.ingredient_id,
        quantity: item.quantity,
        unit: item.unit,
      })),
    };
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ficha técnica</CardTitle>
      </CardHeader>
      <CardContent>
        <RecipeForm productId={productId} ingredients={ingredients ?? []} initialRecipe={initialRecipe} />
      </CardContent>
    </Card>
  );
}
