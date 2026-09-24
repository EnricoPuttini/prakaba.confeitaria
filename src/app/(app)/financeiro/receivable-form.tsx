"use client";

import { useActionState } from "react";
import { createAccountReceivable, type FinanceActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Customer = { id: string; name: string };

const initialState: FinanceActionState = {};

export function ReceivableForm({ customers }: { customers: Customer[] }) {
  const [state, formAction, pending] = useActionState(createAccountReceivable, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova conta a receber avulsa</CardTitle>
      </CardHeader>
      <form action={formAction} key={state.error ? "error" : "idle"}>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="rDescription">Descrição</Label>
            <Input id="rDescription" name="description" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rAmount">Valor (R$)</Label>
            <Input id="rAmount" name="amount" type="number" step="0.01" min="0.01" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rDueDate">Vencimento</Label>
            <Input id="rDueDate" name="dueDate" type="date" />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="customerId">Cliente</Label>
            <Select id="customerId" name="customerId" defaultValue="">
              <option value="">Sem cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
          </div>
          {state.error && <p className="text-sm text-error sm:col-span-4">{state.error}</p>}
        </CardContent>
        <CardContent className="pt-0">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Adicionar conta a receber"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
