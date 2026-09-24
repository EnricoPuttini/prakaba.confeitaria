"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { orderStatuses } from "@/lib/validations/reservation";
import { updateOrderStatus } from "../actions";

const STATUS_LABELS: Record<(typeof orderStatuses)[number], string> = {
  PENDENTE: "Pendente",
  CONFIRMADA: "Confirmada",
  EM_PRODUCAO: "Em produção",
  PRONTA: "Pronta",
  ENTREGUE: "Entregue",
  CANCELADA: "Cancelada",
};

export function StatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={pending}
      onChange={(event) => {
        const newStatus = event.target.value;
        startTransition(async () => {
          await updateOrderStatus(orderId, newStatus);
          router.refresh();
        });
      }}
      className="w-48"
    >
      {orderStatuses.map((option) => (
        <option key={option} value={option}>
          {STATUS_LABELS[option]}
        </option>
      ))}
    </Select>
  );
}
