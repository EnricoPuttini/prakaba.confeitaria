import { z } from "zod";
import { unitOptions } from "./units";
import { optionalText } from "./helpers";

export const recipeItemSchema = z.object({
  ingredientId: z.string().uuid(),
  quantity: z.coerce.number().positive("A quantidade deve ser maior que zero"),
  unit: z.enum(unitOptions),
});

export const recipeSchema = z.object({
  yieldQuantity: z.coerce.number().positive("Informe quantas unidades o lote rende"),
  additionalCost: z.coerce.number().min(0, "O custo adicional não pode ser negativo"),
  notes: optionalText,
  items: z.array(recipeItemSchema).min(1, "Adicione ao menos um ingrediente à receita"),
});

export type RecipeInput = z.infer<typeof recipeSchema>;
