"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: AuthActionState = {};

export function LoginForm({ notice }: { notice?: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          {notice && (
            <p className="rounded-lg border border-border bg-background p-3 text-sm text-secondary-foreground">
              {notice}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state.error && <p className="text-sm text-error">{state.error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-center text-sm text-secondary-foreground">
            Ainda não tem conta?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Criar confeitaria
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
