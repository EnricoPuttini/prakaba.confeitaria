import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UNIT_LABELS, type unitOptions } from "@/lib/validations/units";

function formatQuantity(value: number) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

export default async function EstoquePage() {
  const supabase = await createClient();

  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("id, name, kind, unit, current_stock, minimum_stock, active")
    .order("name");

  return (
    <>
      <PageHeader
        title="Estoque"
        description="Ingredientes e insumos, com estoque atual e mínimo configurado."
      />

      <div className="mb-4 flex justify-end gap-2">
        <Button asChild variant="secondary">
          <Link href="/estoque/fornecedores">Fornecedores</Link>
        </Button>
        <Button asChild>
          <Link href="/estoque/novo">Novo item</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
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
              {ingredients?.map((ingredient) => {
                const low =
                  ingredient.minimum_stock != null && ingredient.current_stock < ingredient.minimum_stock;
                return (
                  <tr key={ingredient.id} className="border-b border-border last:border-0">
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
                    <td className={`px-6 py-3 ${low ? "font-medium text-error" : "text-foreground"}`}>
                      {formatQuantity(ingredient.current_stock)}{" "}
                      {UNIT_LABELS[ingredient.unit as (typeof unitOptions)[number]]}
                    </td>
                    <td className="px-6 py-3 text-secondary-foreground">
                      {ingredient.minimum_stock != null ? formatQuantity(ingredient.minimum_stock) : "—"}
                    </td>
                    <td className="px-6 py-3">
                      {!ingredient.active ? (
                        <span className="text-secondary-foreground">Inativo</span>
                      ) : low ? (
                        <span className="text-error">Estoque baixo</span>
                      ) : (
                        <span className="text-success">OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!ingredients?.length && (
                <tr>
                  <td className="px-6 py-6 text-secondary-foreground" colSpan={5}>
                    Nenhum item de estoque cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
