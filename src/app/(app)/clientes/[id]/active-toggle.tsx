"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleCustomerActive } from "../actions";

export function ActiveToggle({ customerId, active }: { customerId: string; active: boolean }) {
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
          await toggleCustomerActive(customerId, !active);
          router.refresh();
        });
      }}
    >
      {active ? "Desativar cliente" : "Ativar cliente"}
    </Button>
  );
}
