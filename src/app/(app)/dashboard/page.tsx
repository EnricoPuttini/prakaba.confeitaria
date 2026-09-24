import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/dashboard/queries";
import { resolveDateRange, type DateRangePreset } from "@/lib/reports/date-range";
import { colorForChannel, colorForPaymentMethod } from "@/lib/charts/colors";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodFilter } from "./period-filter";
import { RevenueChart } from "./charts/revenue-chart";
import { CategoryBarChart } from "./charts/category-bar-chart";
import { TopProductsChart } from "./charts/top-products-chart";

const CHANNEL_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  RESERVA: "Reserva",
  IFOOD: "iFood",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  OUTRO: "Outro",
};

const METHOD_LABELS: Record<string, string> = { PIX: "PIX", CARTAO: "Cartão", DINHEIRO: "Dinheiro" };

const FINANCE_ROLES = ["OWNER", "MANAGER", "FINANCE"] as const;

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const profile = await requireCurrentProfile();
  const includeFinance = FINANCE_ROLES.includes(profile.role as (typeof FINANCE_ROLES)[number]);

  const preset = (params.period as DateRangePreset) || "7dias";
  const { from, to } = resolveDateRange(preset, params.from, params.to);

  const supabase = await createClient();
  const data = await getDashboardData(supabase, from, to, includeFinance);

  const channelItems = data.revenueByChannel
    .map((item) => ({
      key: item.channel,
      label: CHANNEL_LABELS[item.channel] ?? item.channel,
      value: item.revenue,
      color: colorForChannel(item.channel),
    }))
    .sort((a, b) => b.value - a.value);

  const paymentItems = data.amountByPaymentMethod
    .map((item) => ({
      key: item.method,
      label: METHOD_LABELS[item.method] ?? item.method,
      value: item.amount,
      color: colorForPaymentMethod(item.method),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <PageHeader
        title={`Olá, ${profile.fullName.split(" ")[0]}`}
        description="Resumo da operação da PRAKABÁ."
      />

      <PeriodFilter current={preset} from={params.from} to={params.to} />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground">Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{formatCurrency(data.cards.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground">Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{data.cards.salesCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground">Reservas no período</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{data.cards.reservationsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground">Ticket médio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{formatCurrency(data.cards.averageTicket)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground">Reservas pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{data.cards.pendingReservations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground">Em produção</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{data.cards.inProductionReservations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground">Estoque crítico</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-semibold ${data.cards.criticalStockCount > 0 ? "text-error" : "text-foreground"}`}
            >
              {data.cards.criticalStockCount}
            </p>
          </CardContent>
        </Card>
        {includeFinance && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-secondary-foreground">
                  A pagar (7 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-foreground">
                  {formatCurrency(data.cards.upcomingPayables)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-secondary-foreground">A receber</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-foreground">
                  {formatCurrency(data.cards.pendingReceivables)}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Evolução do faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.dailyRevenue} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos mais vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProductsChart data={data.topProducts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendas por canal</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBarChart items={channelItems} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formas de pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBarChart items={paymentItems} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
