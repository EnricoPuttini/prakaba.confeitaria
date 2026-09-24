"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { completeProductionOrder, type CompleteActionState } from "../actions";

type Item = { productId: string; productName: string; plannedQuantity: number };

const initialState: CompleteActionState = {};

export function CompleteForm({ orderId, items }: { orderId: string; items: Item[] }) {
  const action = completeProductionOrder.bind(null, orderId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [produced, setProduced] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((item) => [item.productId, String(item.plannedQuantity)])),
  );

  const payload = items.map((item) => ({
    productId: item.productId,
    producedQuantity: produced[item.productId] ?? "0",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Concluir produção</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <input type="hidden" name="items" value={JSON.stringify(payload)} />
        <CardContent className="flex flex-col gap-4">
          {items.map((item) => {
            const producedValue = Number(produced[item.productId]) || 0;
            return (
              <div key={item.productId} className="flex flex-col gap-2 rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{item.productName}</p>
                    <p className="text-xs text-secondary-foreground">Planejado: {item.plannedQuantity}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`produced-${item.productId}`} className="text-xs">
                      Produzido
                    </Label>
                    <Input
                      id={`produced-${item.productId}`}
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-28"
                      value={produced[item.productId] ?? ""}
                      onChange={(event) =>
                        setProduced((current) => ({ ...current, [item.productId]: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <Progress
                  value={producedValue}
                  max={item.plannedQuantity}
                  tone={producedValue >= item.plannedQuantity ? "success" : "warning"}
                />
              </div>
            );
          })}
          {state.error && <p className="text-sm text-error">{state.error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Concluindo..." : "Concluir produção"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
