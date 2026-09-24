"use client";

import { useActionState } from "react";
import { createCategory, type CategoryActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: CategoryActionState = {};

export function CategoryForm() {
  const [state, formAction, pending] = useActionState(createCategory, initialState);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex flex-1 flex-col gap-2">
        <label htmlFor="categoryName" className="text-sm font-medium text-foreground">
          Nova categoria
        </label>
        <Input id="categoryName" name="name" placeholder="Ex: Cookies" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Criando..." : "Adicionar"}
      </Button>
      {state.error && <p className="text-sm text-error">{state.error}</p>}
    </form>
  );
}
