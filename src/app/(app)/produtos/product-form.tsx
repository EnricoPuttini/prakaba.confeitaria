"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { unitOptions, UNIT_LABELS } from "@/lib/validations/units";
import type { ProductActionState } from "./actions";

type Category = { id: string; name: string };

type ProductFormValues = {
  name: string;
  categoryId: string | null;
  sku: string | null;
  description: string | null;
  salePrice: number;
  saleUnit: string;
  minimumStock: number | null;
  productionTimeMinutes: number | null;
  shelfLifeDays: number | null;
};

const initialState: ProductActionState = {};

export function ProductForm({
  categories,
  action,
  initialValues,
  submitLabel,
}: {
  categories: Category[];
  action: (prevState: ProductActionState, formData: FormData) => Promise<ProductActionState>;
  initialValues?: ProductFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card>
      <form action={formAction}>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="name">Nome do produto</Label>
            <Input id="name" name="name" defaultValue={initialValues?.name} required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="categoryId">Categoria</Label>
            <Select id="categoryId" name="categoryId" defaultValue={initialValues?.categoryId ?? ""}>
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" defaultValue={initialValues?.sku ?? ""} />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" defaultValue={initialValues?.description ?? ""} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="salePrice">Preço de venda (R$)</Label>
            <Input
              id="salePrice"
              name="salePrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initialValues?.salePrice ?? ""}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="saleUnit">Unidade de venda</Label>
            <Select id="saleUnit" name="saleUnit" defaultValue={initialValues?.saleUnit ?? "UNIDADE"}>
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {UNIT_LABELS[unit]}
                </option>
              ))}
            </Select>
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="productionTimeMinutes">Tempo de produção (min)</Label>
            <Input
              id="productionTimeMinutes"
              name="productionTimeMinutes"
              type="number"
              min="0"
              defaultValue={initialValues?.productionTimeMinutes ?? ""}
              placeholder="Opcional"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="shelfLifeDays">Validade (dias)</Label>
            <Input
              id="shelfLifeDays"
              name="shelfLifeDays"
              type="number"
              min="0"
              defaultValue={initialValues?.shelfLifeDays ?? ""}
              placeholder="Opcional"
            />
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
