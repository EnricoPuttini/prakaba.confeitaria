"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product ? product.sale_price * item.quantity : 0);
  }, 0);

  function setQuantity(productId: string, quantity: number) {
    setQuantities((current) => ({ ...current, [productId]: Math.max(0, quantity) }));
  }

  if (state.success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-surface py-16 text-center">
        <p className="text-2xl font-semibold text-success">
          Venda #{state.success.orderNumber} registrada!
        </p>
        <p className="text-lg text-foreground">Total: {formatCurrency(state.success.total)}</p>
        <p className="text-sm text-secondary-foreground">
          Pagamento: {METHOD_LABELS[state.success.method] ?? state.success.method}
        </p>
        <Button size="lg" onClick={onNewSale}>
          Nova venda
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="method" value={method ?? ""} />

      <Input
        placeholder="Buscar produto..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="h-12 text-base"
      />

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface">
        {filteredProducts.map((product) => {
          const quantity = quantities[product.id] ?? 0;
          return (
            <div
              key={product.id}
              className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{product.name}</p>
                <p className="text-sm text-secondary-foreground">{formatCurrency(product.sale_price)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 text-lg"
                  onClick={() => setQuantity(product.id, quantity - 1)}
                  disabled={quantity === 0}
                >
                  −
                </Button>
                <span className="w-6 text-center text-lg font-semibold text-foreground">{quantity}</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 text-lg"
                  onClick={() => setQuantity(product.id, quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          );
        })}
        {filteredProducts.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-secondary-foreground">
            Nenhum produto encontrado.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <p className="text-sm text-secondary-foreground">{itemCount} itens</p>
        <p className="text-2xl font-semibold text-foreground">TOTAL: {formatCurrency(total)}</p>
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
    </form>
  );
}
