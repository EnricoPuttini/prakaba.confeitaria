import { z } from "zod";
import { optionalText } from "./helpers";

export const productionItemSchema = z.object({
  productId: z.string().uuid(),
  plannedQuantity: z.coerce.number().positive("A quantidade deve ser maior que zero"),
});

export const productionOrderSchema = z.object({
  plannedDate: optionalText,
  notes: optionalText,
  items: z.array(productionItemSchema).min(1, "Adicione ao menos um produto"),
});

export type ProductionOrderInput = z.infer<typeof productionOrderSchema>;

export const producedQuantitySchema = z.object({
  productId: z.string().uuid(),
  producedQuantity: z.coerce.number().min(0, "A quantidade produzida não pode ser negativa"),
});

export const completeProductionSchema = z.object({
  items: z.array(producedQuantitySchema).min(1),
});

export type CompleteProductionInput = z.infer<typeof completeProductionSchema>;
