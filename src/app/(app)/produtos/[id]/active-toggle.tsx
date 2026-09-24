"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleProductActive } from "../actions";

export function ActiveToggle({ productId, active }: { productId: string; active: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await toggleProductActive(productId, !active);
          router.refresh();
        });
      }}
    >
      {active ? "Desativar produto" : "Ativar produto"}
    </Button>
  );
}
