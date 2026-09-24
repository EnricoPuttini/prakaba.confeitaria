"use client";

import { LineChart as LineChartIcon } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_GRID_COLOR, CHART_TEXT_COLOR, SEQUENTIAL_BLUE } from "@/lib/charts/colors";
import { EmptyState } from "@/components/ui/empty-state";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={LineChartIcon}
        title="Sem vendas no período"
        description="O faturamento diário aparece aqui assim que houver vendas ou reservas."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: CHART_TEXT_COLOR }}
          tickFormatter={(value: string) =>
            new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
          }
        />
        <YAxis
          tick={{ fontSize: 12, fill: CHART_TEXT_COLOR }}
          width={70}
          tickFormatter={(value: number) => formatCurrency(value)}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value) || 0)}
          labelFormatter={(value) => (typeof value === "string" ? new Date(value).toLocaleDateString("pt-BR") : "")}
        />
        <Line type="monotone" dataKey="revenue" stroke={SEQUENTIAL_BLUE} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
