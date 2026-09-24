import Link from "next/link";
import { Boxes } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { UNIT_LABELS, type unitOptions } from "@/lib/validations/units";

function formatQuantity(value: number) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

const FILTERS = [
  { value: null, label: "Todos" },
  { value: "baixo", label: "Estoque baixo" },
  { value: "inativos", label: "Inativos" },
] as const;

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const activeFilter = filter === "baixo" || filter === "inativos" ? filter : null;

  const supabase = await createClient();

  const { data } = await supabase
    .from("ingredients")
    .select("id, name, kind, unit, current_stock, minimum_stock, active")
    .order("name");

  const withHealth = (data ?? []).map((ingredient) => ({
    ...ingredient,
    low: ingredient.minimum_stock != null && ingredient.current_stock < ingredient.minimum_stock,
  }));

  const filtered = withHealth.filter((ingredient) => {
    if (activeFilter === "baixo") return ingredient.active && ingredient.low;
    if (activeFilter === "inativos") return !ingredient.active;
    return true;
  });

  // Prioriza o que precisa de atenção: itens ativos com estoque baixo primeiro,
  // depois os demais ativos, depois inativos — sempre alfabético dentro do grupo.
  const sorted = [...filtered].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    if (a.low !== b.low) return a.low ? -1 : 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  return (
    <>
      <PageHeader
        title="Estoque"
        description="Ingredientes e insumos, com estoque atual e mínimo configurado."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <Link
              key={option.label}
              href={option.value ? `/estoque?filter=${option.value}` : "/estoque"}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                activeFilter === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-muted text-secondary-foreground hover:bg-primary-subtle",
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/estoque/fornecedores">Fornecedores</Link>
          </Button>
          <Button asChild>
            <Link href="/estoque/novo">Novo item</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {sorted.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-secondary-foreground">
                    <th className="px-6 py-3 font-medium">Nome</th>
                    <th className="px-6 py-3 font-medium">Tipo</th>
                    <th className="px-6 py-3 font-medium">Estoque atual</th>
                    <th className="px-6 py-3 font-medium">Mínimo</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((ingredient) => (
                    <tr key={ingredient.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                      <td className="px-6 py-3">
                        <Link
                          href={`/estoque/${ingredient.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {ingredient.name}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        {ingredient.kind === "INGREDIENTE" ? "Ingrediente" : "Insumo"}
                      </td>
                      <td className={cn("px-6 py-3", ingredient.low ? "font-medium text-error" : "text-foreground")}>
                        {formatQuantity(ingredient.current_stock)}{" "}
                        {UNIT_LABELS[ingredient.unit as (typeof unitOptions)[number]]}
                      </td>
                      <td className="px-6 py-3 text-secondary-foreground">
                        {ingredient.minimum_stock != null ? formatQuantity(ingredient.minimum_stock) : "—"}
                      </td>
                      <td className="px-6 py-3">
                        {!ingredient.active ? (
                          <Badge tone="neutral">Inativo</Badge>
                        ) : ingredient.low ? (
                          <Badge tone="error">Estoque baixo</Badge>
                        ) : (
                          <Badge tone="success">OK</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Boxes}
              title={activeFilter ? "Nenhum item encontrado" : "Nenhum item de estoque cadastrado ainda"}
              description={activeFilter ? "Tente outro filtro." : "Cadastre ingredientes e insumos para acompanhar o estoque."}
              action={
                !activeFilter && (
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/estoque/novo">Novo item</Link>
                  </Button>
                )
              }
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
