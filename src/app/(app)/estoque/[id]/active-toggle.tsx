"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleIngredientActive } from "../actions";

export function ActiveToggle({ ingredientId, active }: { ingredientId: string; active: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await toggleIngredientActive(ingredientId, !active);
          router.refresh();
        });
      }}
    >
      {active ? "Desativar item" : "Ativar item"}
    </Button>
  );
}
