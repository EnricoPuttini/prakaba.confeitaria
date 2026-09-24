"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { CustomerActionState } from "./actions";

type CustomerFormValues = {
  name: string;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  notes: string | null;
};

const initialState: CustomerActionState = {};

export function CustomerForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (prevState: CustomerActionState, formData: FormData) => Promise<CustomerActionState>;
  initialValues?: CustomerFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card>
      <form action={formAction}>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={initialValues?.name} required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" defaultValue={initialValues?.phone ?? ""} placeholder="Opcional" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="birthDate">Data de nascimento</Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              defaultValue={initialValues?.birthDate ?? ""}
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" name="address" defaultValue={initialValues?.address ?? ""} placeholder="Opcional" />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" defaultValue={initialValues?.notes ?? ""} />
          </div>

          {state.error && <p className="text-sm text-error sm:col-span-2">{state.error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
