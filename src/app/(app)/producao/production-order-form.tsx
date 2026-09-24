"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ProductionActionState } from "./actions";

type Product = { id: string; name: string };
type ItemState = { productId: string; plannedQuantity: string };

type InitialOrder = {
  plannedDate: string | null;
  notes: string | null;
  items: { productId: string; plannedQuantity: number }[];
};

const initialState: ProductionActionState = {};

export function ProductionOrderForm({
  products,
  action,
  initialOrder,
  submitLabel,
}: {
  products: Product[];
  action: (prevState: ProductionActionState, formData: FormData) => Promise<ProductionActionState>;
  initialOrder?: InitialOrder;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const [items, setItems] = useState<ItemState[]>(
    () =>
      initialOrder?.items.map((item) => ({
        productId: item.productId,
        plannedQuantity: String(item.plannedQuantity),
      })) ?? [],
  );

  function addItem() {
    setItems((current) => [...current, { productId: products[0].id, plannedQuantity: "" }]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
  }

  function updateItem(index: number, patch: Partial<ItemState>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  if (products.length === 0) {
    return (
      <p className="text-sm text-secondary-foreground">
        Cadastre ao menos um produto antes de criar uma ordem de produção.
      </p>
    );
  }

  return (
    <Card>
      <form action={formAction}>
        <input type="hidden" name="items" value={JSON.stringify(items)} />
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="plannedDate">Data planejada</Label>
              <Input
                id="plannedDate"
                name="plannedDate"
                type="date"
                defaultValue={initialOrder?.plannedDate ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" defaultValue={initialOrder?.notes ?? ""} />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Produtos a produzir</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                Adicionar produto
              </Button>
            </div>

            {items.length === 0 && (
              <p className="text-sm text-secondary-foreground">Nenhum produto adicionado ainda.</p>
            )}

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr_8rem_auto] items-end gap-2">
                <Select
                  value={item.productId}
                  onChange={(event) => updateItem(index, { productId: event.target.value })}
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Qtd."
                  value={item.plannedQuantity}
                  onChange={(event) => updateItem(index, { plannedQuantity: event.target.value })}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                  Remover
                </Button>
              </div>
            ))}
          </div>

          {state.error && <p className="text-sm text-error">{state.error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending || items.length === 0}>
            {pending ? "Salvando..." : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
