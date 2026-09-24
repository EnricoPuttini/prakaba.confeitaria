"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { orderChannels } from "@/lib/validations/reservation";
import type { ReservationActionState } from "./actions";

type Product = { id: string; name: string; sale_price: number };
type Customer = { id: string; name: string };
type ItemState = { productId: string; quantity: string; unitPrice: string };

const CHANNEL_LABELS: Record<(typeof orderChannels)[number], string> = {
  PRESENCIAL: "Presencial",
  RESERVA: "Reserva",
  IFOOD: "iFood",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  OUTRO: "Outro",
};

type InitialReservation = {
  customerId: string;
  channel: string;
  scheduledAt: string | null;
  discount: number;
  notes: string | null;
  items: { productId: string; quantity: number; unitPrice: number }[];
};

const initialState: ReservationActionState = {};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ReservationForm({
  products,
  customers,
  action,
  initialReservation,
}: {
  products: Product[];
  customers: Customer[];
  action: (prevState: ReservationActionState, formData: FormData) => Promise<ReservationActionState>;
  initialReservation?: InitialReservation;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const [items, setItems] = useState<ItemState[]>(
    () =>
      initialReservation?.items.map((item) => ({
        productId: item.productId,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
      })) ?? [],
  );

  function addItem() {
    const first = products[0];
    setItems((current) => [
      ...current,
      { productId: first.id, quantity: "1", unitPrice: String(first.sale_price) },
    ]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
  }

  function updateItem(index: number, patch: Partial<ItemState>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function handleProductChange(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateItem(index, { productId, unitPrice: product ? String(product.sale_price) : "0" });
  }

  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  );

  if (customers.length === 0) {
    return (
      <p className="text-sm text-secondary-foreground">
        Cadastre ao menos um cliente antes de criar uma reserva.
      </p>
    );
  }

  if (products.length === 0) {
    return (
      <p className="text-sm text-secondary-foreground">
        Cadastre ao menos um produto antes de criar uma reserva.
      </p>
    );
  }

  return (
    <Card>
      <form action={formAction}>
        <input type="hidden" name="items" value={JSON.stringify(items)} />
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="customerId">Cliente</Label>
              <Select id="customerId" name="customerId" defaultValue={initialReservation?.customerId ?? ""} required>
                <option value="" disabled>
                  Selecione...
                </option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="channel">Canal</Label>
              <Select id="channel" name="channel" defaultValue={initialReservation?.channel ?? "RESERVA"}>
                {orderChannels.map((channel) => (
                  <option key={channel} value={channel}>
                    {CHANNEL_LABELS[channel]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="scheduledAt">Data/hora de retirada ou entrega</Label>
              <Input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                defaultValue={toDatetimeLocal(initialReservation?.scheduledAt ?? null)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="discount">Desconto (R$)</Label>
              <Input
                id="discount"
                name="discount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initialReservation?.discount ?? 0}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" defaultValue={initialReservation?.notes ?? ""} />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Produtos</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                Adicionar produto
              </Button>
            </div>

            {items.length === 0 && (
              <p className="text-sm text-secondary-foreground">Nenhum produto adicionado ainda.</p>
            )}

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr_6rem_8rem_auto] items-end gap-2">
                <Select value={item.productId} onChange={(e) => handleProductChange(index, e.target.value)}>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Qtd."
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Preço"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                  Remover
                </Button>
              </div>
            ))}
          </div>

          <p className="text-right text-sm text-secondary-foreground">
            Subtotal:{" "}
            <span className="font-semibold text-foreground">
              {subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </p>

          {state.error && <p className="text-sm text-error">{state.error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending || items.length === 0}>
            {pending ? "Salvando..." : "Salvar reserva"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
