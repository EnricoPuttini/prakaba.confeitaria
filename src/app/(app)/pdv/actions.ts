"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";

const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
});

const saleSchema = z.object({
  method: z.enum(["PIX", "CARTAO", "DINHEIRO"]),
  items: z.array(saleItemSchema).min(1, "Adicione ao menos um produto"),
});

export type SaleActionState = {
  error?: string;
  success?: { orderNumber: number; total: number; method: string };
};

export async function finalizeSale(
  operationId: string,
  _prevState: SaleActionState,
  formData: FormData,
): Promise<SaleActionState> {
  await requireCurrentProfile();

  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Itens inválidos." };
  }

  const parsed = saleSchema.safeParse({
    method: formData.get("method"),
    items,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data: orderId, error } = await supabase.rpc("create_sale", {
    p_operation_id: operationId,
    p_channel: "PRESENCIAL",
    p_customer_id: null,
    p_payment_method: parsed.data.method,
    p_items: parsed.data.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    })),
  });

  if (error) {
    if (error.message.includes("operation is closed")) {
      return { error: "A operação foi fechada. Abra uma nova operação para continuar vendendo." };
    }
    if (error.message.includes("not authorized")) {
      return { error: "Você não tem permissão para registrar vendas." };
    }
    return { error: "Não foi possível registrar a venda." };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("order_number, total")
    .eq("id", orderId)
    .single();

  revalidatePath("/operacoes");
  revalidatePath(`/operacoes/${operationId}`);

  if (!order) {
    return { error: "Venda registrada, mas não foi possível carregar os detalhes." };
  }

  return {
    success: { orderNumber: order.order_number, total: order.total, method: parsed.data.method },
  };
}
