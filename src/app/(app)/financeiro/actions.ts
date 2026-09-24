"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import {
  accountPayableSchema,
  accountReceivableSchema,
  financialCategorySchema,
} from "@/lib/validations/finance";

const STAFF_ROLES = ["OWNER", "MANAGER", "FINANCE"] as const;

export type FinanceActionState = {
  error?: string;
};

async function requireFinanceAccess() {
  const profile = await requireCurrentProfile();
  if (!STAFF_ROLES.includes(profile.role as (typeof STAFF_ROLES)[number])) {
    throw new Error("Você não tem permissão para acessar o financeiro.");
  }
  return profile;
}

export async function createFinancialCategory(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const profile = await requireFinanceAccess();

  const parsed = financialCategorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("financial_categories").insert({
    organization_id: profile.organizationId,
    name: parsed.data.name,
  });

  if (error) {
    if (error.message.includes("duplicate key")) {
      return { error: "Já existe uma categoria com este nome." };
    }
    return { error: "Não foi possível criar a categoria." };
  }

  revalidatePath("/financeiro");
  return {};
}

export async function createAccountPayable(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const profile = await requireFinanceAccess();

  const parsed = accountPayableSchema.safeParse({
    description: formData.get("description"),
    supplierId: formData.get("supplierId"),
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("accounts_payable").insert({
    organization_id: profile.organizationId,
    description: parsed.data.description,
    supplier_id: parsed.data.supplierId ?? null,
    category_id: parsed.data.categoryId ?? null,
    amount: parsed.data.amount,
    due_date: parsed.data.dueDate,
  });

  if (error) {
    return { error: "Não foi possível salvar a conta a pagar." };
  }

  revalidatePath("/financeiro");
  return {};
}

export async function markAccountPayablePaid(accountId: string) {
  await requireFinanceAccess();

  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts_payable")
    .update({ status: "PAGO", paid_at: new Date().toISOString().slice(0, 10) })
    .eq("id", accountId);

  if (error) {
    throw new Error("Não foi possível marcar como paga.");
  }

  revalidatePath("/financeiro");
}

export async function createAccountReceivable(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const profile = await requireFinanceAccess();

  const parsed = accountReceivableSchema.safeParse({
    description: formData.get("description"),
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("accounts_receivable").insert({
    organization_id: profile.organizationId,
    description: parsed.data.description,
    customer_id: parsed.data.customerId ?? null,
    amount: parsed.data.amount,
    due_date: parsed.data.dueDate ?? null,
  });

  if (error) {
    return { error: "Não foi possível salvar a conta a receber." };
  }

  revalidatePath("/financeiro");
  return {};
}

export async function markAccountReceivablePaid(accountId: string) {
  await requireFinanceAccess();

  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts_receivable")
    .update({ status: "PAGO", paid_at: new Date().toISOString().slice(0, 10) })
    .eq("id", accountId);

  if (error) {
    throw new Error("Não foi possível marcar como recebida.");
  }

  revalidatePath("/financeiro");
}
