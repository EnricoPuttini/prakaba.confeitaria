"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_TEXT_COLOR, SEQUENTIAL_BLUE } from "@/lib/charts/colors";

export function TopProductsChart({ data }: { data: { productName: string; quantity: number }[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-secondary-foreground">Sem vendas no período.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
        <XAxis type="number" tick={{ fontSize: 12, fill: CHART_TEXT_COLOR }} allowDecimals={false} />
        <YAxis type="category" dataKey="productName" tick={{ fontSize: 12, fill: CHART_TEXT_COLOR }} width={130} />
        <Tooltip formatter={(value) => [`${Number(value) || 0} unidades`, "Vendido"]} />
        <Bar dataKey="quantity" fill={SEQUENTIAL_BLUE} radius={[0, 4, 4, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
