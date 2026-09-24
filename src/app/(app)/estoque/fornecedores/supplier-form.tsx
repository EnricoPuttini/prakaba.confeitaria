"use client";

import { useActionState } from "react";
import { createSupplier, type SupplierActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: SupplierActionState = {};

export function SupplierForm() {
  const [state, formAction, pending] = useActionState(createSupplier, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo fornecedor</CardTitle>
      </CardHeader>
      <form action={formAction} key={state.success ? "sent" : "idle"}>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" placeholder="Opcional" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="Opcional" />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-3">
            <Label htmlFor="notes">Observações</Label>
            <Input id="notes" name="notes" placeholder="Opcional" />
          </div>
          {state.error && <p className="text-sm text-error sm:col-span-3">{state.error}</p>}
        </CardContent>
        <CardContent className="pt-0">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Adicionar fornecedor"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
