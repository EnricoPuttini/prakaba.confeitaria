"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { completeProductionSchema, productionOrderSchema } from "@/lib/validations/production";

const STAFF_ROLES = ["OWNER", "MANAGER", "PRODUCTION"] as const;

export type ProductionActionState = {
  error?: string;
};

export async function saveProductionOrder(
  orderId: string | null,
  _prevState: ProductionActionState,
  formData: FormData,
): Promise<ProductionActionState> {
  const profile = await requireCurrentProfile();
  if (!STAFF_ROLES.includes(profile.role as (typeof STAFF_ROLES)[number])) {
    return { error: "Você não tem permissão para gerenciar produção." };
  }

  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Itens inválidos." };
  }

  const parsed = productionOrderSchema.safeParse({
    plannedDate: formData.get("plannedDate"),
    notes: formData.get("notes"),
    items,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_production_order", {
    p_order_id: orderId,
    p_planned_date: parsed.data.plannedDate ?? null,
    p_notes: parsed.data.notes ?? null,
    p_items: parsed.data.items.map((item) => ({
      product_id: item.productId,
      planned_quantity: item.plannedQuantity,
    })),
  });

  if (error) {
    if (error.message.includes("only a planned production order can be edited")) {
      return { error: "Só é possível editar uma ordem enquanto ela está planejada." };
    }
    return { error: "Não foi possível salvar a ordem de produção." };
  }

  revalidatePath("/producao");
  if (orderId) {
    revalidatePath(`/producao/${orderId}`);
    return {};
  }

  redirect(`/producao/${data}`);
}

export async function startProductionOrder(orderId: string) {
  const profile = await requireCurrentProfile();
  if (!STAFF_ROLES.includes(profile.role as (typeof STAFF_ROLES)[number])) {
    throw new Error("Você não tem permissão para iniciar a produção.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("production_orders")
    .update({ status: "EM_PRODUCAO", started_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "PLANEJADA");

  if (error) {
    throw new Error("Não foi possível iniciar a produção.");
  }

  revalidatePath("/producao");
  revalidatePath(`/producao/${orderId}`);
}

export async function cancelProductionOrder(orderId: string) {
  const profile = await requireCurrentProfile();
  if (!STAFF_ROLES.includes(profile.role as (typeof STAFF_ROLES)[number])) {
    throw new Error("Você não tem permissão para cancelar a produção.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("production_orders")
    .update({ status: "CANCELADA" })
    .eq("id", orderId)
    .neq("status", "CONCLUIDA");

  if (error) {
    throw new Error("Não foi possível cancelar a produção.");
  }

  revalidatePath("/producao");
  revalidatePath(`/producao/${orderId}`);
}

export type CompleteActionState = {
  error?: string;
};

export async function completeProductionOrder(
  orderId: string,
  _prevState: CompleteActionState,
  formData: FormData,
): Promise<CompleteActionState> {
  await requireCurrentProfile();

  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Itens inválidos." };
  }

  const parsed = completeProductionSchema.safeParse({ items });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_production_order", {
    p_order_id: orderId,
    p_produced_quantities: parsed.data.items.map((item) => ({
      product_id: item.productId,
      produced_quantity: item.producedQuantity,
    })),
  });

  if (error) {
    if (error.message.includes("estoque insuficiente")) {
      return { error: "Estoque de ingredientes insuficiente para concluir esta produção." };
    }
    if (error.message.includes("not authorized")) {
      return { error: "Você não tem permissão para concluir a produção." };
    }
    return { error: "Não foi possível concluir a produção." };
  }

  revalidatePath("/producao");
  revalidatePath(`/producao/${orderId}`);
  revalidatePath("/estoque");
  return {};
}
