"use client";

import { useActionState } from "react";
import { createAccountPayable, type FinanceActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Supplier = { id: string; name: string };
type Category = { id: string; name: string };

const initialState: FinanceActionState = {};

export function PayableForm({ suppliers, categories }: { suppliers: Supplier[]; categories: Category[] }) {
  const [state, formAction, pending] = useActionState(createAccountPayable, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova conta a pagar</CardTitle>
      </CardHeader>
      <form action={formAction} key={state.error ? "error" : "idle"}>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" name="description" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dueDate">Vencimento</Label>
            <Input id="dueDate" name="dueDate" type="date" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="supplierId">Fornecedor</Label>
            <Select id="supplierId" name="supplierId" defaultValue="">
              <option value="">Sem fornecedor</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="categoryId">Categoria</Label>
            <Select id="categoryId" name="categoryId" defaultValue="">
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          {state.error && <p className="text-sm text-error sm:col-span-4">{state.error}</p>}
        </CardContent>
        <CardContent className="pt-0">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Adicionar conta a pagar"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
