"use client";

import { PieChart } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_TEXT_COLOR } from "@/lib/charts/colors";
import { EmptyState } from "@/components/ui/empty-state";

type Item = { key: string; label: string; value: number; color: string };

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CategoryBarChart({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return <EmptyState icon={PieChart} title="Sem dados no período" />;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={items} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 12, fill: CHART_TEXT_COLOR }} tickFormatter={formatCurrency} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: CHART_TEXT_COLOR }} width={90} />
          <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
            {items.map((item) => (
              <Cell key={item.key} fill={item.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {items.map((item) => (
          <span key={item.key} className="flex items-center gap-1.5 text-xs text-secondary-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
