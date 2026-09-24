"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { orderStatuses, paymentSchema, reservationSchema } from "@/lib/validations/reservation";

export type ReservationActionState = {
  error?: string;
};

export async function saveReservation(
  orderId: string | null,
  _prevState: ReservationActionState,
  formData: FormData,
): Promise<ReservationActionState> {
  await requireCurrentProfile();

  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Itens da reserva inválidos." };
  }

  const parsed = reservationSchema.safeParse({
    customerId: formData.get("customerId"),
    channel: formData.get("channel"),
    scheduledAt: formData.get("scheduledAt"),
    discount: formData.get("discount"),
    notes: formData.get("notes"),
    items,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_reservation", {
    p_order_id: orderId,
    p_customer_id: parsed.data.customerId,
    p_channel: parsed.data.channel,
    p_scheduled_at: parsed.data.scheduledAt ?? null,
    p_discount: parsed.data.discount ?? 0,
    p_notes: parsed.data.notes ?? null,
    p_items: parsed.data.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    })),
  });

  if (error) {
    if (error.message.includes("not authorized")) {
      return { error: "Você não tem permissão para gerenciar reservas." };
    }
    if (error.message.includes("invalid discount")) {
      return { error: "O desconto não pode ser maior que o subtotal." };
    }
    return { error: "Não foi possível salvar a reserva." };
  }

  revalidatePath("/reservas");
  if (orderId) {
    revalidatePath(`/reservas/${orderId}`);
    return {};
  }

  redirect(`/reservas/${data}`);
}

export async function updateOrderStatus(orderId: string, status: string) {
  await requireCurrentProfile();

  if (!orderStatuses.includes(status as (typeof orderStatuses)[number])) {
    throw new Error("Status inválido.");
  }
  const validStatus = status as (typeof orderStatuses)[number];

  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status: validStatus }).eq("id", orderId);

  if (error) {
    throw new Error("Não foi possível atualizar o status.");
  }

  revalidatePath("/reservas");
  revalidatePath(`/reservas/${orderId}`);
}

export type PaymentActionState = {
  error?: string;
  success?: boolean;
};

export async function registerReservationPayment(
  orderId: string,
  _prevState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  await requireCurrentProfile();

  const parsed = paymentSchema.safeParse({
    amount: formData.get("amount"),
    method: formData.get("method"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("register_payment", {
    p_order_id: orderId,
    p_amount: parsed.data.amount,
    p_method: parsed.data.method,
  });

  if (error) {
    if (error.message.includes("exceeds order total")) {
      return { error: "Esse valor excede o restante a pagar." };
    }
    if (error.message.includes("not authorized")) {
      return { error: "Você não tem permissão para registrar pagamentos." };
    }
    return { error: "Não foi possível registrar o pagamento." };
  }

  revalidatePath(`/reservas/${orderId}`);
  revalidatePath("/reservas");
  return { success: true };
}
