import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UNIT_LABELS, type unitOptions } from "@/lib/validations/units";
import { IngredientForm } from "../ingredient-form";
import { updateIngredient } from "../actions";
import { ActiveToggle } from "./active-toggle";
import { MovementForm } from "./movement-form";

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  AJUSTE: "Ajuste",
  CONSUMO_PRODUCAO: "Consumo em produção",
  PERDA: "Perda",
  DEVOLUCAO: "Devolução",
};

function formatQuantity(value: number) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

export default async function EditarItemEstoquePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: ingredient }, { data: suppliers }, { data: movements }] = await Promise.all([
    supabase.from("ingredients").select("*").eq("id", id).maybeSingle(),
    supabase.from("suppliers").select("id, name").eq("active", true).order("name"),
    supabase
      .from("inventory_movements")
      .select("id, type, quantity, unit, reason, created_at")
      .eq("ingredient_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!ingredient) {
    notFound();
  }

  return (
    <>
      <PageHeader title={ingredient.name} description="Editar item de estoque." />

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-secondary-foreground">
          Estoque atual:{" "}
          <span className="font-semibold text-foreground">
            {formatQuantity(ingredient.current_stock)}{" "}
            {UNIT_LABELS[ingredient.unit as (typeof unitOptions)[number]]}
          </span>
        </p>
        <ActiveToggle ingredientId={ingredient.id} active={ingredient.active} />
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Registrar movimentação</CardTitle>
          </CardHeader>
          <CardContent>
            <MovementForm ingredientId={ingredient.id} defaultUnit={ingredient.unit} />
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <IngredientForm
          suppliers={suppliers ?? []}
          action={updateIngredient.bind(null, ingredient.id)}
          submitLabel="Salvar alterações"
          initialValues={{
            name: ingredient.name,
            kind: ingredient.kind,
            unit: ingredient.unit,
            costPerUnit: ingredient.cost_per_unit,
            minimumStock: ingredient.minimum_stock,
            supplierId: ingredient.supplier_id,
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de movimentações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-secondary-foreground">
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Quantidade</th>
                <th className="px-6 py-3 font-medium">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movements?.map((movement) => (
                <tr key={movement.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3 text-secondary-foreground">
                    {new Date(movement.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-6 py-3 text-foreground">
                    {MOVEMENT_TYPE_LABELS[movement.type] ?? movement.type}
                  </td>
                  <td className="px-6 py-3 text-foreground">
                    {movement.quantity > 0 ? "+" : ""}
                    {formatQuantity(movement.quantity)}{" "}
                    {UNIT_LABELS[movement.unit as (typeof unitOptions)[number]]}
                  </td>
                  <td className="px-6 py-3 text-secondary-foreground">{movement.reason ?? "—"}</td>
                </tr>
              ))}
              {!movements?.length && (
                <tr>
                  <td className="px-6 py-6 text-secondary-foreground" colSpan={4}>
                    Nenhuma movimentação registrada ainda.
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
