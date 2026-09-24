import type { ComponentType } from "react";
import { CheckCircle2, ChefHat, Clock, HandCoins, PackageX, Wallet } from "lucide-react";
import { requireCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/dashboard/queries";
import { resolveDateRange, type DateRangePreset } from "@/lib/reports/date-range";
import { colorForChannel, colorForPaymentMethod } from "@/lib/charts/colors";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

type Tone = "neutral" | "primary" | "success" | "warning" | "error";

const TONE_ICON_STYLES: Record<Tone, string> = {
  neutral: "bg-surface-muted text-secondary-foreground",
  primary: "bg-primary-subtle text-primary",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  error: "bg-error-subtle text-error",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function HealthCard({
  icon: Icon,
  tone,
  label,
  value,
  caption,
}: {
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
  label: string;
  value: string | number;
  caption: string;
}) {
  return (
    <Card variant="alert" tone={tone}>
      <CardContent className="flex items-start gap-3 p-5">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            TONE_ICON_STYLES[tone],
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-secondary-foreground">{label}</p>
          <p className="text-xl font-semibold text-foreground">{value}</p>
          <p className="text-xs text-secondary-foreground">{caption}</p>
        </div>
      </CardContent>
    </Card>
  );
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
        description="Como está a operação da PRAKABÁ."
      />

      <PeriodFilter current={preset} from={params.from} to={params.to} />

      {/* Métrica principal: o número que mais importa no período selecionado. */}
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <Card variant="elevated" className="lg:col-span-2">
          <CardContent className="flex flex-col gap-2 p-6 sm:p-8">
            <p className="text-sm font-medium text-secondary-foreground">Faturamento no período</p>
            <p className="font-brand text-4xl font-semibold text-foreground sm:text-5xl">
              {formatCurrency(data.cards.revenue)}
            </p>
            <p className="text-sm text-secondary-foreground">
              Ticket médio de {formatCurrency(data.cards.averageTicket)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex h-full flex-col justify-center divide-y divide-border p-6">
            <div className="pb-4">
              <p className="text-sm text-secondary-foreground">Vendas no período</p>
              <p className="text-2xl font-semibold text-foreground">{data.cards.salesCount}</p>
            </div>
            <div className="pt-4">
              <p className="text-sm text-secondary-foreground">Reservas no período</p>
              <p className="text-2xl font-semibold text-foreground">{data.cards.reservationsCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saúde da operação: estado atual, independente do período selecionado. */}
      <div className="mb-8">
        <p className="mb-3 text-[11px] font-semibold tracking-wider text-secondary-foreground/70 uppercase">
          Saúde da operação agora
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <HealthCard
            icon={data.cards.criticalStockCount > 0 ? PackageX : CheckCircle2}
            tone={data.cards.criticalStockCount > 0 ? "error" : "success"}
            label="Estoque crítico"
            value={data.cards.criticalStockCount}
            caption={
              data.cards.criticalStockCount > 0
                ? "itens abaixo do mínimo"
                : "Nenhum item abaixo do mínimo"
            }
          />
          <HealthCard
            icon={data.cards.pendingReservations > 0 ? Clock : CheckCircle2}
            tone={data.cards.pendingReservations > 0 ? "warning" : "success"}
            label="Reservas pendentes"
            value={data.cards.pendingReservations}
            caption={
              data.cards.pendingReservations > 0
                ? "aguardando confirmação"
                : "Nenhuma pendência"
            }
          />
          <HealthCard
            icon={ChefHat}
            tone="primary"
            label="Em produção"
            value={data.cards.inProductionReservations}
            caption="reservas sendo preparadas"
          />
          {includeFinance && (
            <>
              <HealthCard
                icon={data.cards.upcomingPayables > 0 ? Wallet : CheckCircle2}
                tone={data.cards.upcomingPayables > 0 ? "warning" : "success"}
                label="A pagar em 7 dias"
                value={formatCurrency(data.cards.upcomingPayables)}
                caption={
                  data.cards.upcomingPayables > 0
                    ? "vencimento próximo"
                    : "Nenhum vencimento próximo"
                }
              />
              <HealthCard
                icon={HandCoins}
                tone="primary"
                label="A receber"
                value={formatCurrency(data.cards.pendingReceivables)}
                caption="saldo pendente de clientes"
              />
            </>
          )}
        </div>
      </div>

      {/* Detalhes do período: gráficos de apoio, hierarquia abaixo dos blocos acima. */}
      <div>
        <p className="mb-3 text-[11px] font-semibold tracking-wider text-secondary-foreground/70 uppercase">
          Detalhes do período
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
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
      </div>
    </>
  );
}
