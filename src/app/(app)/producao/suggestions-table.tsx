import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Suggestion = {
  product_id: string;
  product_name: string;
  reserved_demand: number;
  current_stock: number;
  committed_stock: number;
  available_stock: number;
  suggested_quantity: number;
};

function formatQuantity(value: number) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function SuggestionsTable({ suggestions }: { suggestions: Suggestion[] }) {
  const withDemand = suggestions.filter((s) => s.suggested_quantity > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sugestão de produção</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {withDemand.length === 0 ? (
          <p className="px-6 py-6 text-sm text-secondary-foreground">
            Nenhuma produção sugerida no momento — o estoque disponível cobre a demanda reservada.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-secondary-foreground">
                  <th className="px-6 py-3 font-medium">Produto</th>
                  <th className="px-6 py-3 font-medium">Reservado</th>
                  <th className="px-6 py-3 font-medium">Disponível</th>
                  <th className="px-6 py-3 font-medium">Sugestão</th>
                  <th className="px-6 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {withDemand.map((suggestion) => (
                  <tr key={suggestion.product_id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                    <td className="px-6 py-3 text-foreground">{suggestion.product_name}</td>
                    <td className="px-6 py-3 text-secondary-foreground">
                      {formatQuantity(suggestion.reserved_demand)}
                    </td>
                    <td className="px-6 py-3 text-secondary-foreground">
                      {formatQuantity(suggestion.available_stock)}
                    </td>
                    <td className="px-6 py-3">
                      <Badge tone="warning">{formatQuantity(suggestion.suggested_quantity)}</Badge>
                    </td>
                    <td className="px-6 py-3">
                      <Button asChild variant="secondary" size="sm">
                        <Link
                          href={`/producao/novo?productId=${suggestion.product_id}&quantity=${suggestion.suggested_quantity}`}
                        >
                          Criar ordem
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
