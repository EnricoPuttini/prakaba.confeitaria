import { z } from "zod";
import { optionalText } from "./helpers";

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do cliente"),
  phone: optionalText,
  address: optionalText,
  birthDate: optionalText,
  notes: optionalText,
});

export type CustomerInput = z.infer<typeof customerSchema>;
