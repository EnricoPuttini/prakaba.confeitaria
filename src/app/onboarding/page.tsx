import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function ConfigError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <p className="text-error">
        Não foi possível configurar seu acesso. Tente sair e entrar novamente.
      </p>
    </div>
  );
}

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

  // Convite: organization_id/role/full_name vêm de app_metadata, gravados
  // pela service role ao enviar o convite — o usuário não consegue alterá-los.
  const invitedOrgId = user.app_metadata?.organization_id as string | undefined;

  if (invitedOrgId) {
    const { error } = await supabase.rpc("accept_invitation");

    if (error && !error.message.includes("already belongs")) {
      return <ConfigError />;
    }

    redirect("/dashboard");
  }

  // Cadastro próprio: organization_name/full_name vêm de user_metadata,
  // preenchidos no formulário de signup.
  const organizationName = (user.user_metadata?.organization_name as string | undefined)?.trim();
  const fullName = (user.user_metadata?.full_name as string | undefined)?.trim();

  if (!organizationName || !fullName) {
    redirect("/login?setupIncomplete=1");
  }

  const { error } = await supabase.rpc("create_organization_with_owner", {
    org_name: organizationName,
    owner_full_name: fullName,
  });

  if (error && !error.message.includes("already belongs")) {
    return <ConfigError />;
  }

  redirect("/dashboard");
}
