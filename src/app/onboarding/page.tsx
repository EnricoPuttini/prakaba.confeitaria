import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    redirect("/dashboard");
  }

  const organizationName = (user.user_metadata?.organization_name as string | undefined)?.trim();
  const fullName = (user.user_metadata?.full_name as string | undefined)?.trim();

  if (!organizationName || !fullName) {
    // Cadastro incompleto (ex: usuário criado fora do fluxo de signup padrão).
    redirect("/login?setupIncomplete=1");
  }

  const { error } = await supabase.rpc("create_organization_with_owner", {
    org_name: organizationName,
    owner_full_name: fullName,
  });

  if (error && !error.message.includes("already belongs")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-error">
          Não foi possível configurar sua confeitaria. Tente sair e entrar novamente.
        </p>
      </div>
    );
  }

  redirect("/dashboard");
}
