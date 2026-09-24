"use client";

import { useActionState } from "react";
import { openOperation, type OperationActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: OperationActionState = {};

export function OpenOperationForm() {
  const [state, formAction, pending] = useActionState(openOperation, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abrir operação</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="location">Local</Label>
            <Input id="location" name="location" placeholder="Ex: Faculdade X" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="openingCash">Caixa inicial (R$)</Label>
            <Input id="openingCash" name="openingCash" type="number" step="0.01" min="0" defaultValue="0" required />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="notes">Observações</Label>
            <Input id="notes" name="notes" placeholder="Opcional" />
          </div>
          {state.error && <p className="text-sm text-error sm:col-span-2">{state.error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Abrindo..." : "Abrir operação"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
