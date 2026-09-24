import { z } from "zod";
import { optionalText } from "./helpers";

export const orderChannels = [
  "PRESENCIAL",
  "RESERVA",
  "IFOOD",
  "WHATSAPP",
  "INSTAGRAM",
  "OUTRO",
] as const;

export const orderStatuses = [
  "PENDENTE",
  "CONFIRMADA",
  "EM_PRODUCAO",
  "PRONTA",
  "ENTREGUE",
  "CANCELADA",
] as const;

export const paymentMethods = ["PIX", "CARTAO", "DINHEIRO"] as const;

export const reservationItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().positive("A quantidade deve ser maior que zero"),
  unitPrice: z.coerce.number().min(0),
});

export const reservationSchema = z.object({
  customerId: z.string().uuid("Selecione um cliente"),
  channel: z.enum(orderChannels),
  scheduledAt: optionalText,
  discount: z.coerce.number().min(0).optional().default(0),
  notes: optionalText,
  items: z.array(reservationItemSchema).min(1, "Adicione ao menos um produto"),
});

export type ReservationInput = z.infer<typeof reservationSchema>;

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Informe um valor maior que zero"),
  method: z.enum(paymentMethods),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
