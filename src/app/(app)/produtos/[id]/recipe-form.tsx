"use client";

import { useActionState, useState } from "react";
import { saveRecipe, type RecipeActionState } from "./recipe-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { unitOptions, UNIT_LABELS } from "@/lib/validations/units";

type Ingredient = { id: string; name: string; unit: string };
type RecipeItemState = { ingredientId: string; quantity: string; unit: string };

type InitialRecipe = {
  yieldQuantity: number;
  additionalCost: number;
  notes: string | null;
  items: { ingredientId: string; quantity: number; unit: string }[];
};

const initialState: RecipeActionState = {};

export function RecipeForm({
  productId,
  ingredients,
  initialRecipe,
}: {
  productId: string;
  ingredients: Ingredient[];
  initialRecipe: InitialRecipe | null;
}) {
  const action = saveRecipe.bind(null, productId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const [items, setItems] = useState<RecipeItemState[]>(
    () =>
      initialRecipe?.items.map((item) => ({
        ingredientId: item.ingredientId,
        quantity: String(item.quantity),
        unit: item.unit,
      })) ?? [],
  );

  function addItem() {
    setItems((current) => [...current, { ingredientId: ingredients[0].id, quantity: "", unit: ingredients[0].unit }]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
  }

  function updateItem(index: number, patch: Partial<RecipeItemState>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  if (ingredients.length === 0) {
    return (
      <p className="text-sm text-secondary-foreground">
        Cadastre ao menos um ingrediente no estoque antes de montar a ficha técnica.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="yieldQuantity">Quantidade produzida por lote</Label>
          <Input
            id="yieldQuantity"
            name="yieldQuantity"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialRecipe?.yieldQuantity ?? ""}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="additionalCost">Custo adicional por lote (R$)</Label>
          <Input
            id="additionalCost"
            name="additionalCost"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialRecipe?.additionalCost ?? 0}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" name="notes" defaultValue={initialRecipe?.notes ?? ""} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>Ingredientes da receita</Label>
          <Button type="button" variant="secondary" size="sm" onClick={addItem}>
            Adicionar ingrediente
          </Button>
        </div>

        {items.length === 0 && (
          <p className="text-sm text-secondary-foreground">Nenhum ingrediente adicionado ainda.</p>
        )}

        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-[1fr_7rem_10rem_auto] items-end gap-2">
            <Select
              value={item.ingredientId}
              onChange={(event) => updateItem(index, { ingredientId: event.target.value })}
            >
              {ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              step="0.0001"
              min="0"
              placeholder="Qtd."
              value={item.quantity}
              onChange={(event) => updateItem(index, { quantity: event.target.value })}
            />
            <Select value={item.unit} onChange={(event) => updateItem(index, { unit: event.target.value })}>
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {UNIT_LABELS[unit]}
                </option>
              ))}
            </Select>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
              Remover
            </Button>
          </div>
        ))}
      </div>

      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {state.success && <p className="text-sm text-success">Ficha técnica salva.</p>}

      <div>
        <Button type="submit" disabled={pending || items.length === 0}>
          {pending ? "Salvando..." : "Salvar ficha técnica"}
        </Button>
      </div>
    </form>
  );
}
