"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { customerSchema } from "@/lib/validations/customer";

const STAFF_ROLES = ["OWNER", "MANAGER", "SALES"] as const;

export type CustomerActionState = {
  error?: string;
};

function parseCustomerForm(formData: FormData) {
  return customerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    birthDate: formData.get("birthDate"),
    notes: formData.get("notes"),
  });
}

export async function createCustomer(
  _prevState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const profile = await requireCurrentProfile();
  if (!STAFF_ROLES.includes(profile.role as (typeof STAFF_ROLES)[number])) {
    return { error: "Você não tem permissão para cadastrar clientes." };
  }

  const parsed = parseCustomerForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      organization_id: profile.organizationId,
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      address: parsed.data.address ?? null,
      birth_date: parsed.data.birthDate ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Não foi possível salvar o cliente." };
  }

  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

export async function updateCustomer(
  customerId: string,
  _prevState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const profile = await requireCurrentProfile();
  if (!STAFF_ROLES.includes(profile.role as (typeof STAFF_ROLES)[number])) {
    return { error: "Você não tem permissão para editar clientes." };
  }

  const parsed = parseCustomerForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      address: parsed.data.address ?? null,
      birth_date: parsed.data.birthDate ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", customerId);

  if (error) {
    return { error: "Não foi possível salvar o cliente." };
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${customerId}`);
  return {};
}

export async function toggleCustomerActive(customerId: string, active: boolean) {
  const profile = await requireCurrentProfile();
  if (!STAFF_ROLES.includes(profile.role as (typeof STAFF_ROLES)[number])) {
    throw new Error("Você não tem permissão para alterar clientes.");
  }

  const supabase = await createClient();
  await supabase.from("customers").update({ active }).eq("id", customerId);

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${customerId}`);
}
