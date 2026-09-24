"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { ingredientSchema, movementSchema, supplierSchema } from "@/lib/validations/ingredient";

const STAFF_ROLES = ["OWNER", "MANAGER", "PRODUCTION"] as const;

export type IngredientActionState = {
  error?: string;
};

function parseIngredientForm(formData: FormData) {
  return ingredientSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    unit: formData.get("unit"),
    costPerUnit: formData.get("costPerUnit"),
    minimumStock: formData.get("minimumStock"),
    supplierId: formData.get("supplierId"),
  });
}

export async function createIngredient(
  _prevState: IngredientActionState,
  formData: FormData,
): Promise<IngredientActionState> {
  const profile = await requireCurrentProfile();
  if (!STAFF_ROLES.includes(profile.role as (typeof STAFF_ROLES)[number])) {
    return { error: "Você não tem permissão para cadastrar itens de estoque." };
  }

  const parsed = parseIngredientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredients")
    .insert({
      organization_id: profile.organizationId,
      name: parsed.data.name,
      kind: parsed.data.kind,
      unit: parsed.data.unit,
      cost_per_unit: parsed.data.costPerUnit,
      minimum_stock: parsed.data.minimumStock ?? null,
      supplier_id: parsed.data.supplierId ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Não foi possível salvar o item." };
  }

  revalidatePath("/estoque");
  redirect(`/estoque/${data.id}`);
}

export async function updateIngredient(
  ingredientId: string,
  _prevState: IngredientActionState,
  formData: FormData,
): Promise<IngredientActionState> {
  const profile = await requireCurrentProfile();
  if (!STAFF_ROLES.includes(profile.role as (typeof STAFF_ROLES)[number])) {
    return { error: "Você não tem permissão para editar itens de estoque." };
  }

  const parsed = parseIngredientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ingredients")
    .update({
      name: parsed.data.name,
      kind: parsed.data.kind,
      unit: parsed.data.unit,
      cost_per_unit: parsed.data.costPerUnit,
      minimum_stock: parsed.data.minimumStock ?? null,
      supplier_id: parsed.data.supplierId ?? null,
    })
    .eq("id", ingredientId);

  if (error) {
    return { error: "Não foi possível salvar o item." };
  }

  revalidatePath("/estoque");
  revalidatePath(`/estoque/${ingredientId}`);
  return {};
}

export async function toggleIngredientActive(ingredientId: string, active: boolean) {
  const profile = await requireCurrentProfile();
  if (!STAFF_ROLES.includes(profile.role as (typeof STAFF_ROLES)[number])) {
    throw new Error("Você não tem permissão para alterar itens de estoque.");
  }

  const supabase = await createClient();
  await supabase.from("ingredients").update({ active }).eq("id", ingredientId);

  revalidatePath("/estoque");
  revalidatePath(`/estoque/${ingredientId}`);
}

export type MovementActionState = {
  error?: string;
  success?: boolean;
};

export async function registerMovement(
  ingredientId: string,
  _prevState: MovementActionState,
  formData: FormData,
): Promise<MovementActionState> {
  await requireCurrentProfile();

  const parsed = movementSchema.safeParse({
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    unit: formData.get("unit"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("register_inventory_movement", {
    p_ingredient_id: ingredientId,
    p_type: parsed.data.type,
    p_quantity: parsed.data.quantity,
    p_unit: parsed.data.unit,
    p_reason: parsed.data.reason ?? null,
  });

  if (error) {
    if (error.message.includes("not authorized")) {
      return { error: "Você não tem permissão para registrar movimentações." };
    }
    if (error.message.includes("estoque insuficiente")) {
      return { error: "Estoque insuficiente para esta movimentação." };
    }
    return { error: "Não foi possível registrar a movimentação." };
  }

  revalidatePath(`/estoque/${ingredientId}`);
  revalidatePath("/estoque");
  return { success: true };
}

export type SupplierActionState = {
  error?: string;
  success?: boolean;
};

export async function createSupplier(
  _prevState: SupplierActionState,
  formData: FormData,
): Promise<SupplierActionState> {
  const profile = await requireCurrentProfile();
  if (!STAFF_ROLES.includes(profile.role as (typeof STAFF_ROLES)[number])) {
    return { error: "Você não tem permissão para cadastrar fornecedores." };
  }

  const parsed = supplierSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").insert({
    organization_id: profile.organizationId,
    name: parsed.data.name,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email ?? null,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    return { error: "Não foi possível salvar o fornecedor." };
  }

  revalidatePath("/estoque/fornecedores");
  revalidatePath("/estoque/novo");
  revalidatePath("/estoque");
  return { success: true };
}
