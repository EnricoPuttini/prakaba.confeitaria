"use client";

import { useActionState } from "react";
import { createFinancialCategory, type FinanceActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: FinanceActionState = {};

export function CategoryForm() {
  const [state, formAction, pending] = useActionState(createFinancialCategory, initialState);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex flex-1 flex-col gap-2">
        <label htmlFor="financeCategoryName" className="text-sm font-medium text-foreground">
          Nova categoria (contas a pagar)
        </label>
        <Input id="financeCategoryName" name="name" placeholder="Ex: Ingredientes" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Criando..." : "Adicionar"}
      </Button>
      {state.error && <p className="text-sm text-error">{state.error}</p>}
    </form>
  );
}
