"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelProductionOrder, startProductionOrder } from "../actions";

export function StartButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await startProductionOrder(orderId);
          router.refresh();
        });
      }}
    >
      {pending ? "Iniciando..." : "Iniciar produção"}
    </Button>
  );
}

export function CancelButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await cancelProductionOrder(orderId);
          router.refresh();
        });
      }}
    >
      {pending ? "Cancelando..." : "Cancelar"}
    </Button>
  );
}
