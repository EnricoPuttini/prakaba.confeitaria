import { z } from "zod";
import { optionalText, optionalUuid } from "./helpers";

export const financialCategorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria"),
});

export const accountPayableSchema = z.object({
  description: z.string().trim().min(2, "Informe a descrição"),
  supplierId: optionalUuid,
  categoryId: optionalUuid,
  amount: z.coerce.number().positive("O valor deve ser maior que zero"),
  dueDate: z.string().min(1, "Informe o vencimento"),
});

export type AccountPayableInput = z.infer<typeof accountPayableSchema>;

export const accountReceivableSchema = z.object({
  description: z.string().trim().min(2, "Informe a descrição"),
  customerId: optionalUuid,
  amount: z.coerce.number().positive("O valor deve ser maior que zero"),
  dueDate: optionalText,
});

export type AccountReceivableInput = z.infer<typeof accountReceivableSchema>;
