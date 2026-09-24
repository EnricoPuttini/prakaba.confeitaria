import { z } from "zod";
import { optionalText } from "./helpers";

export const openOperationSchema = z.object({
  location: optionalText,
  openingCash: z.coerce.number().min(0, "O caixa inicial não pode ser negativo"),
  notes: optionalText,
});

export type OpenOperationInput = z.infer<typeof openOperationSchema>;

export const closeOperationSchema = z.object({
  closingCashCounted: z.coerce.number().min(0, "Informe o valor contado em caixa"),
  notes: optionalText,
});

export type CloseOperationInput = z.infer<typeof closeOperationSchema>;
