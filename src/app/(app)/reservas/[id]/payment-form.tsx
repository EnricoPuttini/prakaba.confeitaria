"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { paymentMethods } from "@/lib/validations/reservation";
import { registerReservationPayment, type PaymentActionState } from "../actions";

const METHOD_LABELS: Record<(typeof paymentMethods)[number], string> = {
  PIX: "PIX",
  CARTAO: "Cartão",
  DINHEIRO: "Dinheiro",
};

const initialState: PaymentActionState = {};

export function PaymentForm({ orderId }: { orderId: string }) {
  const action = registerReservationPayment.bind(null, orderId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form key={state.success ? "sent" : "idle"} action={formAction} className="grid gap-4 sm:grid-cols-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Valor recebido (R$)</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="method">Forma de pagamento</Label>
        <Select id="method" name="method" defaultValue="PIX">
          {paymentMethods.map((method) => (
            <option key={method} value={method}>
              {METHOD_LABELS[method]}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Registrando..." : "Registrar pagamento"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-error sm:col-span-3">{state.error}</p>}
      {state.success && (
        <p className="flex items-center gap-1.5 text-sm text-success sm:col-span-3">
          <CheckCircle2 className="h-4 w-4" /> Pagamento registrado.
        </p>
      )}
    </form>
  );
}
