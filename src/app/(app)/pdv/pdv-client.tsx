"use client";

import { useActionState, useMemo, useState } from "react";
import { CheckCircle2, Minus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { finalizeSale, type SaleActionState } from "./actions";

type Product = { id: string; name: string; sale_price: number };

const PAYMENT_METHODS = [
  { value: "PIX", label: "PIX" },
  { value: "CARTAO", label: "Cartão" },
  { value: "DINHEIRO", label: "Dinheiro" },
] as const;

const METHOD_LABELS: Record<string, string> = { PIX: "PIX", CARTAO: "Cartão", DINHEIRO: "Dinheiro" };

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const initialState: SaleActionState = {};

export function PdvClient({ operationId, products }: { operationId: string; products: Product[] }) {
  const [saleKey, setSaleKey] = useState(0);

  return (
    <SaleCart
      key={saleKey}
      operationId={operationId}
      products={products}
      onNewSale={() => setSaleKey((key) => key + 1)}
    />
  );
}

function SaleCart({
  operationId,
  products,
  onNewSale,
}: {
  operationId: string;
  products: Product[];
  onNewSale: () => void;
}) {
  const action = finalizeSale.bind(null, operationId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]["value"] | null>(null);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => product.name.toLowerCase().includes(term));
  }, [products, search]);

  const items = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([productId, quantity]) => ({ productId, quantity })),
    [quantities],
  );

  const cartLines = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) return null;
          return { product, quantity: item.quantity, subtotal: product.sale_price * item.quantity };
        })
        .filter((line): line is { product: Product; quantity: number; subtotal: number } => line !== null),
    [items, products],
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartLines.reduce((sum, line) => sum + line.subtotal, 0);

  function setQuantity(productId: string, quantity: number) {
    setQuantities((current) => ({ ...current, [productId]: Math.max(0, quantity) }));
  }

  if (state.success) {
    return (
      <Card variant="elevated">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-subtle text-success">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <p className="font-brand text-2xl font-semibold text-foreground">
              Venda #{state.success.orderNumber} registrada!
            </p>
            <p className="mt-1 text-lg text-foreground">Total: {formatCurrency(state.success.total)}</p>
            <p className="text-sm text-secondary-foreground">
              Pagamento: {METHOD_LABELS[state.success.method] ?? state.success.method}
            </p>
          </div>
          <Button size="lg" onClick={onNewSale}>
            Nova venda
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="method" value={method ?? ""} />

      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-secondary-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-12 pl-10 text-base"
          />
        </div>

        {filteredProducts.length === 0 ? (
          <Card>
            <EmptyState icon={Search} title="Nenhum produto encontrado" description="Tente buscar por outro nome." />
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const quantity = quantities[product.id] ?? 0;
              return (
                <div
                  key={product.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-lg border p-4 transition-colors",
                    quantity > 0 ? "border-primary bg-primary-subtle" : "border-border bg-surface",
                  )}
                >
                  <div className="min-h-10">
                    <p className="line-clamp-2 text-sm font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-secondary-foreground">{formatCurrency(product.sale_price)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setQuantity(product.id, quantity - 1)}
                      disabled={quantity === 0}
                      aria-label={`Remover uma unidade de ${product.name}`}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-semibold text-foreground">{quantity}</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setQuantity(product.id, quantity + 1)}
                      aria-label={`Adicionar uma unidade de ${product.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Card variant="elevated" className="lg:sticky lg:top-6">
        <CardContent className="flex flex-col gap-4 p-5">
          <div>
            <p className="text-sm font-medium text-secondary-foreground">Resumo da venda</p>
            <p className="text-xs text-secondary-foreground">
              {itemCount === 0 ? "Nenhum item selecionado" : `${itemCount} ${itemCount === 1 ? "item" : "itens"}`}
            </p>
          </div>

          {cartLines.length > 0 && (
            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto border-y border-border py-3">
              {cartLines.map((line) => (
                <div key={line.product.id} className="flex items-start justify-between gap-2 text-sm">
                  <span className="text-foreground">
                    {line.quantity}× {line.product.name}
                  </span>
                  <span className="shrink-0 font-medium text-foreground">{formatCurrency(line.subtotal)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium text-secondary-foreground">Total</p>
            <p className="font-brand text-3xl font-semibold text-foreground">{formatCurrency(total)}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="lg"
                variant={method === option.value ? "primary" : "secondary"}
                onClick={() => setMethod(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {state.error && <p className="text-sm text-error">{state.error}</p>}

          <Button type="submit" size="lg" disabled={pending || items.length === 0 || !method}>
            {pending ? "Finalizando..." : "Finalizar venda"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
