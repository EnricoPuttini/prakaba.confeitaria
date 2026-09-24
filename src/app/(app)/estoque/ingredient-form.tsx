"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { unitOptions, UNIT_LABELS } from "@/lib/validations/units";
import { ingredientKinds } from "@/lib/validations/ingredient";
import type { IngredientActionState } from "./actions";

type Supplier = { id: string; name: string };

type IngredientFormValues = {
  name: string;
  kind: string;
  unit: string;
  costPerUnit: number;
  minimumStock: number | null;
  supplierId: string | null;
};

const KIND_LABELS: Record<(typeof ingredientKinds)[number], string> = {
  INGREDIENTE: "Ingrediente (usado em receitas)",
  INSUMO: "Insumo (embalagem, etiqueta, etc.)",
};

const initialState: IngredientActionState = {};

export function IngredientForm({
  suppliers,
  action,
  initialValues,
  submitLabel,
}: {
  suppliers: Supplier[];
  action: (prevState: IngredientActionState, formData: FormData) => Promise<IngredientActionState>;
  initialValues?: IngredientFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card>
      <form action={formAction}>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={initialValues?.name} required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="kind">Tipo</Label>
            <Select id="kind" name="kind" defaultValue={initialValues?.kind ?? "INGREDIENTE"}>
              {ingredientKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_LABELS[kind]}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="unit">Unidade de medida</Label>
            <Select id="unit" name="unit" defaultValue={initialValues?.unit ?? "UNIDADE"}>
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {UNIT_LABELS[unit]}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="costPerUnit">Custo por unidade (R$)</Label>
            <Input
              id="costPerUnit"
              name="costPerUnit"
              type="number"
              step="0.0001"
              min="0"
              defaultValue={initialValues?.costPerUnit ?? ""}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="minimumStock">Estoque mínimo</Label>
            <Input
              id="minimumStock"
              name="minimumStock"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initialValues?.minimumStock ?? ""}
              placeholder="Opcional"
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="supplierId">Fornecedor</Label>
            <Select id="supplierId" name="supplierId" defaultValue={initialValues?.supplierId ?? ""}>
              <option value="">Sem fornecedor</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </Select>
          </div>

          {state.error && <p className="text-sm text-error sm:col-span-2">{state.error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
