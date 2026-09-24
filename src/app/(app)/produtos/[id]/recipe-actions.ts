"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { recipeSchema } from "@/lib/validations/recipe";

export type RecipeActionState = {
  error?: string;
  success?: boolean;
};

export async function saveRecipe(
  productId: string,
  _prevState: RecipeActionState,
  formData: FormData,
): Promise<RecipeActionState> {
  await requireCurrentProfile();

  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Itens da receita inválidos." };
  }

  const parsed = recipeSchema.safeParse({
    yieldQuantity: formData.get("yieldQuantity"),
    additionalCost: formData.get("additionalCost"),
    notes: formData.get("notes"),
    items,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_recipe", {
    p_product_id: productId,
    p_yield_quantity: parsed.data.yieldQuantity,
    p_additional_cost: parsed.data.additionalCost,
    p_notes: parsed.data.notes ?? null,
    p_items: parsed.data.items.map((item) => ({
      ingredient_id: item.ingredientId,
      quantity: item.quantity,
      unit: item.unit,
    })),
  });

  if (error) {
    if (error.message.includes("not authorized")) {
      return { error: "Você não tem permissão para editar fichas técnicas." };
    }
    return { error: "Não foi possível salvar a ficha técnica." };
  }

  revalidatePath(`/produtos/${productId}`);
  return { success: true };
}
