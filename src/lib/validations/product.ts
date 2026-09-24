import { z } from "zod";
import { unitOptions } from "./units";
import { optionalNonNegativeInt, optionalNonNegativeNumber, optionalText, optionalUuid } from "./helpers";

export const productSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do produto"),
  categoryId: optionalUuid,
  sku: optionalText,
  description: optionalText,
  salePrice: z.coerce.number().min(0, "O preço não pode ser negativo"),
  saleUnit: z.enum(unitOptions),
  minimumStock: optionalNonNegativeNumber,
  productionTimeMinutes: optionalNonNegativeInt,
  shelfLifeDays: optionalNonNegativeInt,
});

export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria"),
});
