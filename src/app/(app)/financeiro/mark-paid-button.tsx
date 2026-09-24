"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MarkPaidButton({
  accountId,
  label,
  action,
}: {
  accountId: string;
  label: string;
  action: (id: string) => Promise<void>;
}) {
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
          await action(accountId);
          router.refresh();
        });
      }}
    >
      {pending ? "..." : label}
    </Button>
  );
}
