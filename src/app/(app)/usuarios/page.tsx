import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { InviteForm } from "./invite-form";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Proprietária(o)",
  MANAGER: "Gerente",
  SALES: "Vendas",
  PRODUCTION: "Produção",
  FINANCE: "Financeiro",
};

export default async function UsuariosPage() {
  const profile = await requireCurrentProfile();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, role, active")
    .order("full_name");

  const canInvite = profile.role === "OWNER" || profile.role === "MANAGER";

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Membros da sua confeitaria e seus níveis de acesso."
      />

      {canInvite && (
        <div className="mb-6">
          <InviteForm canInviteManager={profile.role === "OWNER"} />
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-secondary-foreground">
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">Papel</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {members?.map((member) => (
                <tr key={member.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3 text-foreground">{member.full_name}</td>
                  <td className="px-6 py-3 text-foreground">
                    {ROLE_LABELS[member.role] ?? member.role}
                  </td>
                  <td className="px-6 py-3">
                    {member.active ? (
                      <span className="text-success">Ativo</span>
                    ) : (
                      <span className="text-secondary-foreground">Inativo</span>
                    )}
                  </td>
                </tr>
              ))}
              {!members?.length && (
                <tr>
                  <td className="px-6 py-6 text-secondary-foreground" colSpan={3}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <p className="mt-4 text-xs text-secondary-foreground">
        O convite chega por e-mail e a pessoa entra direto na sua confeitaria, sem criar uma
        organização nova.
      </p>
    </>
  );
}
