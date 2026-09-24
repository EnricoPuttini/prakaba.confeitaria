"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { categorySchema, productSchema } from "@/lib/validations/product";

export type ProductActionState = {
  error?: string;
};

const STAFF_ROLES = ["OWNER", "MANAGER", "PRODUCTION"] as const;

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    sku: formData.get("sku"),
    description: formData.get("description"),
    salePrice: formData.get("salePrice"),
    saleUnit: formData.get("saleUnit"),
    minimumStock: formData.get("minimumStock"),
    productionTimeMinutes: formData.get("productionTimeMinutes"),
    shelfLifeDays: formData.get("shelfLifeDays"),
  });
}

export async function createProduct(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const profile = await requireCurrentProfile();
  if (!STAFF_ROLES.includes(profile.role as (typeof STAFF_ROLES)[number])) {
    return { error: "Você não tem permissão para cadastrar produtos." };
  }

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      organization_id: profile.organizationId,
      name: parsed.data.name,
      category_id: parsed.data.categoryId ?? null,
      sku: parsed.data.sku ?? null,
      description: parsed.data.description ?? null,
      sale_price: parsed.data.salePrice,
      sale_unit: parsed.data.saleUnit,
      minimum_stock: parsed.data.minimumStock ?? null,
      production_time_minutes: parsed.data.productionTimeMinutes ?? null,
      shelf_life_days: parsed.data.shelfLifeDays ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("duplicate key")) {
      return { error: "Já existe um produto com este SKU." };
    }
    return { error: "Não foi possível salvar o produto." };
  }

  revalidatePath("/produtos");
  redirect(`/produtos/${data.id}`);
}

export async function updateProduct(
  productId: string,
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const profile = await requireCurrentProfile();
  if (!STAFF_ROLES.includes(profile.role as (typeof STAFF_ROLES)[number])) {
    return { error: "Você não tem permissão para editar produtos." };
  }

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      name: parsed.data.name,
      category_id: parsed.data.categoryId ?? null,
      sku: parsed.data.sku ?? null,
      description: parsed.data.description ?? null,
      sale_price: parsed.data.salePrice,
      sale_unit: parsed.data.saleUnit,
      minimum_stock: parsed.data.minimumStock ?? null,
      production_time_minutes: parsed.data.productionTimeMinutes ?? null,
      shelf_life_days: parsed.data.shelfLifeDays ?? null,
    })
    .eq("id", productId);

  if (error) {
    if (error.message.includes("duplicate key")) {
      return { error: "Já existe um produto com este SKU." };
    }
    return { error: "Não foi possível salvar o produto." };
  }

  revalidatePath("/produtos");
  revalidatePath(`/produtos/${productId}`);
  return {};
}

export async function toggleProductActive(productId: string, active: boolean) {
  const profile = await requireCurrentProfile();
  if (!STAFF_ROLES.includes(profile.role as (typeof STAFF_ROLES)[number])) {
    throw new Error("Você não tem permissão para alterar produtos.");
  }

  const supabase = await createClient();
  await supabase.from("products").update({ active }).eq("id", productId);

  revalidatePath("/produtos");
  revalidatePath(`/produtos/${productId}`);
}

export type CategoryActionState = {
  error?: string;
};

export async function createCategory(
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const profile = await requireCurrentProfile();
  if (!STAFF_ROLES.includes(profile.role as (typeof STAFF_ROLES)[number])) {
    return { error: "Você não tem permissão para criar categorias." };
  }

  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("product_categories").insert({
    organization_id: profile.organizationId,
    name: parsed.data.name,
  });

  if (error) {
    if (error.message.includes("duplicate key")) {
      return { error: "Já existe uma categoria com este nome." };
    }
    return { error: "Não foi possível criar a categoria." };
  }

  revalidatePath("/produtos");
  revalidatePath("/produtos/novo");
  return {};
}
