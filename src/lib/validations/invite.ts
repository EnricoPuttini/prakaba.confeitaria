import { z } from "zod";

export const inviteRoles = ["MANAGER", "SALES", "PRODUCTION", "FINANCE"] as const;

export const inviteSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido"),
  fullName: z.string().trim().min(2, "Informe o nome completo"),
  role: z.enum(inviteRoles),
});

export type InviteInput = z.infer<typeof inviteSchema>;
