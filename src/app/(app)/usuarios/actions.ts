"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteSchema } from "@/lib/validations/invite";

export type InviteActionState = {
  error?: string;
  success?: boolean;
};

async function getOrigin() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export async function inviteMember(
  _prevState: InviteActionState,
  formData: FormData,
): Promise<InviteActionState> {
  const profile = await requireCurrentProfile();

  if (profile.role !== "OWNER" && profile.role !== "MANAGER") {
    return { error: "Você não tem permissão para convidar usuários." };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { email, fullName, role } = parsed.data;

  // MANAGER pode convidar a operação (vendas/produção/financeiro), mas não
  // criar outro MANAGER — só o OWNER concede esse nível de acesso.
  if (role === "MANAGER" && profile.role !== "OWNER") {
    return { error: "Apenas a proprietária(o) pode convidar um(a) Gerente." };
  }

  const origin = await getOrigin();
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/onboarding`,
  });

  if (error) {
    if (error.message.toLowerCase().includes("already been registered")) {
      return { error: "Já existe uma conta com este e-mail." };
    }
    return { error: "Não foi possível enviar o convite. Tente novamente." };
  }

  const { error: metadataError } = await admin.auth.admin.updateUserById(data.user.id, {
    app_metadata: {
      organization_id: profile.organizationId,
      role,
      full_name: fullName,
    },
  });

  if (metadataError) {
    return { error: "Convite criado, mas houve um erro ao configurar o acesso. Tente novamente." };
  }

  revalidatePath("/usuarios");
  return { success: true };
}
