import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OperationSummary } from "@/lib/operations/summary";

const PAYMENT_LABELS: Record<string, string> = { PIX: "PIX", CARTAO: "Cartão", DINHEIRO: "Dinheiro" };
const CHANNEL_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  RESERVA: "Reserva",
  IFOOD: "iFood",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  OUTRO: "Outro",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function OperationSummaryCard({ summary }: { summary: OperationSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-secondary-foreground">Vendas</p>
            <p className="text-lg font-semibold text-foreground">{summary.salesCount}</p>
          </div>
          <div>
            <p className="text-secondary-foreground">Unidades</p>
            <p className="text-lg font-semibold text-foreground">{summary.itemsCount}</p>
          </div>
          <div>
            <p className="text-secondary-foreground">Faturamento</p>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(summary.revenue)}</p>
          </div>
          <div>
            <p className="text-secondary-foreground">Ticket médio</p>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(summary.averageTicket)}</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Por forma de pagamento</p>
            <ul className="flex flex-col gap-1 text-sm text-secondary-foreground">
              {Object.entries(summary.byPaymentMethod).map(([method, amount]) => (
                <li key={method} className="flex justify-between">
                  <span>{PAYMENT_LABELS[method] ?? method}</span>
                  <span className="text-foreground">{formatCurrency(amount)}</span>
                </li>
              ))}
              {Object.keys(summary.byPaymentMethod).length === 0 && <li>Nenhum pagamento ainda.</li>}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Por canal</p>
            <ul className="flex flex-col gap-1 text-sm text-secondary-foreground">
              {Object.entries(summary.byChannel).map(([channel, amount]) => (
                <li key={channel} className="flex justify-between">
                  <span>{CHANNEL_LABELS[channel] ?? channel}</span>
                  <span className="text-foreground">{formatCurrency(amount)}</span>
                </li>
              ))}
              {Object.keys(summary.byChannel).length === 0 && <li>Nenhuma venda ainda.</li>}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
