"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { closeOperationSchema, openOperationSchema } from "@/lib/validations/operation";

export type OperationActionState = {
  error?: string;
};

export async function openOperation(
  _prevState: OperationActionState,
  formData: FormData,
): Promise<OperationActionState> {
  await requireCurrentProfile();

  const parsed = openOperationSchema.safeParse({
    location: formData.get("location"),
    openingCash: formData.get("openingCash"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("open_operation", {
    p_location: parsed.data.location ?? null,
    p_opening_cash: parsed.data.openingCash,
    p_notes: parsed.data.notes ?? null,
  });

  if (error) {
    if (error.message.includes("already an open operation")) {
      return { error: "Já existe uma operação aberta." };
    }
    if (error.message.includes("not authorized")) {
      return { error: "Você não tem permissão para abrir uma operação." };
    }
    return { error: "Não foi possível abrir a operação." };
  }

  revalidatePath("/operacoes");
  revalidatePath("/pdv");
  return {};
}

export async function closeOperation(
  operationId: string,
  _prevState: OperationActionState,
  formData: FormData,
): Promise<OperationActionState> {
  await requireCurrentProfile();

  const parsed = closeOperationSchema.safeParse({
    closingCashCounted: formData.get("closingCashCounted"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("close_operation", {
    p_operation_id: operationId,
    p_closing_cash_counted: parsed.data.closingCashCounted,
    p_notes: parsed.data.notes ?? null,
  });

  if (error) {
    if (error.message.includes("not authorized")) {
      return { error: "Você não tem permissão para fechar a operação." };
    }
    return { error: "Não foi possível fechar a operação." };
  }

  revalidatePath("/operacoes");
  revalidatePath("/pdv");
  return {};
}
