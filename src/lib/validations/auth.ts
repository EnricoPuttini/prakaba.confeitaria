import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe sua senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signUpSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(2, "Informe o nome da confeitaria"),
  fullName: z.string().trim().min(2, "Informe seu nome completo"),
  email: z.string().trim().email("Informe um e-mail válido"),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
