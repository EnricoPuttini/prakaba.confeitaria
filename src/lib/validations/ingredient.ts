import { z } from "zod";
import { unitOptions } from "./units";
import { optionalNonNegativeNumber, optionalText, optionalUuid } from "./helpers";

export const ingredientKinds = ["INGREDIENTE", "INSUMO"] as const;

export const ingredientSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  kind: z.enum(ingredientKinds),
  unit: z.enum(unitOptions),
  costPerUnit: z.coerce.number().min(0, "O custo não pode ser negativo"),
  minimumStock: optionalNonNegativeNumber,
  supplierId: optionalUuid,
});

export type IngredientInput = z.infer<typeof ingredientSchema>;

export const movementTypes = [
  "ENTRADA",
  "SAIDA",
  "AJUSTE",
  "CONSUMO_PRODUCAO",
  "PERDA",
  "DEVOLUCAO",
] as const;

export const movementSchema = z.object({
  type: z.enum(movementTypes),
  quantity: z.coerce.number().refine((val) => val !== 0, "Informe uma quantidade"),
  unit: z.enum(unitOptions),
  reason: optionalText,
});

export type MovementInput = z.infer<typeof movementSchema>;

export const supplierSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do fornecedor"),
  phone: optionalText,
  email: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().trim().email("E-mail inválido").optional(),
  ),
  notes: optionalText,
});

export type SupplierInput = z.infer<typeof supplierSchema>;
