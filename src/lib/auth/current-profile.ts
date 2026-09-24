import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export type CurrentProfile = {
  id: string;
  email: string | undefined;
  fullName: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
};

// Usa apenas dentro de Server Components/Actions da área autenticada
// (`(app)`); redireciona para /login ou /onboarding quando aplicável.
export async function requireCurrentProfile(): Promise<CurrentProfile> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", profile.organization_id)
    .maybeSingle();

  return {
    id: profile.id,
    email: user.email,
    fullName: profile.full_name,
    role: profile.role,
    organizationId: profile.organization_id,
    organizationName: organization?.name ?? "",
  };
}
