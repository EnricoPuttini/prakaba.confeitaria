"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { unitOptions, UNIT_LABELS } from "@/lib/validations/units";
import { movementTypes } from "@/lib/validations/ingredient";
import { registerMovement, type MovementActionState } from "../actions";

const TYPE_LABELS: Record<(typeof movementTypes)[number], string> = {
  ENTRADA: "Entrada (compra/recebimento)",
  SAIDA: "Saída",
  AJUSTE: "Ajuste (+ ou -)",
  CONSUMO_PRODUCAO: "Consumo em produção",
  PERDA: "Perda",
  DEVOLUCAO: "Devolução",
};

const initialState: MovementActionState = {};

export function MovementForm({ ingredientId, defaultUnit }: { ingredientId: string; defaultUnit: string }) {
  const action = registerMovement.bind(null, ingredientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      key={state.success ? "sent" : "idle"}
      action={formAction}
      className="grid gap-4 sm:grid-cols-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Tipo</Label>
        <Select id="type" name="type" defaultValue="ENTRADA">
          {movementTypes.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="quantity">Quantidade</Label>
        <Input id="quantity" name="quantity" type="number" step="0.0001" required />
        <p className="text-xs text-secondary-foreground">Use negativo apenas em Ajuste.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="unit">Unidade</Label>
        <Select id="unit" name="unit" defaultValue={defaultUnit}>
          {unitOptions.map((unit) => (
            <option key={unit} value={unit}>
              {UNIT_LABELS[unit]}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reason">Motivo</Label>
        <Input id="reason" name="reason" placeholder="Opcional" />
      </div>

      <div className="sm:col-span-4">
        {state.error && <p className="mb-2 text-sm text-error">{state.error}</p>}
        {state.success && <p className="mb-2 text-sm text-success">Movimentação registrada.</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Registrando..." : "Registrar movimentação"}
        </Button>
      </div>
    </form>
  );
}
