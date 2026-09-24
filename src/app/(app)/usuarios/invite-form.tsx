"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { inviteMember, type InviteActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ROLE_OPTIONS = [
  { value: "MANAGER", label: "Gerente" },
  { value: "SALES", label: "Vendas" },
  { value: "PRODUCTION", label: "Produção" },
  { value: "FINANCE", label: "Financeiro" },
];

const initialState: InviteActionState = {};

export function InviteForm({ canInviteManager }: { canInviteManager: boolean }) {
  const [state, formAction, pending] = useActionState(inviteMember, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convidar usuário</CardTitle>
      </CardHeader>
      <form action={formAction} key={state.success ? "sent" : "idle"}>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Nome</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Papel</Label>
              <Select id="role" name="role" defaultValue="SALES">
                {ROLE_OPTIONS.filter((option) => option.value !== "MANAGER" || canInviteManager).map(
                  (option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ),
                )}
              </Select>
            </div>
          </div>
          {state.error && <p className="text-sm text-error">{state.error}</p>}
          {state.success && (
            <p className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> Convite enviado por e-mail.
            </p>
          )}
        </CardContent>
        <CardContent className="pt-0">
          <Button type="submit" disabled={pending}>
            {pending ? "Enviando..." : "Enviar convite"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
