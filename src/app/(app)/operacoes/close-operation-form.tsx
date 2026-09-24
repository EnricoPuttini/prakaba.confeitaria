"use client";

import { useActionState } from "react";
import { closeOperation, type OperationActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: OperationActionState = {};

export function CloseOperationForm({ operationId }: { operationId: string }) {
  const action = closeOperation.bind(null, operationId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="closingCashCounted">Dinheiro contado (R$)</Label>
        <Input
          id="closingCashCounted"
          name="closingCashCounted"
          type="number"
          step="0.01"
          min="0"
          required
        />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" name="notes" placeholder="Opcional" />
      </div>
      {state.error && <p className="text-sm text-error sm:col-span-3">{state.error}</p>}
      <div>
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Fechando..." : "Fechar operação"}
        </Button>
      </div>
    </form>
  );
}
