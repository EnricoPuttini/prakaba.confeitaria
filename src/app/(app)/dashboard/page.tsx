import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CARDS = [
  { label: "Faturamento hoje" },
  { label: "Vendas hoje" },
  { label: "Reservas pendentes" },
  { label: "Ticket médio" },
  { label: "Em produção" },
  { label: "Estoque crítico" },
  { label: "Contas a pagar (próximas)" },
  { label: "Contas a receber" },
];

export default async function DashboardPage() {
  const profile = await requireCurrentProfile();

  return (
    <>
      <PageHeader
        title={`Olá, ${profile.fullName.split(" ")[0]}`}
        description="Resumo da operação da PRAKABÁ hoje."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {CARDS.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-secondary-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">—</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="p-6 text-sm text-secondary-foreground">
          Os indicadores aparecerão aqui conforme os módulos de vendas, reservas, estoque,
          produção e financeiro forem implementados nas próximas fases.
        </CardContent>
      </Card>
    </>
  );
}
