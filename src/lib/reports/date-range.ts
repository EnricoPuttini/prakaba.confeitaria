export type DateRangePreset = "hoje" | "7dias" | "30dias" | "mes_atual" | "mes_anterior" | "personalizado";

export const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  hoje: "Hoje",
  "7dias": "7 dias",
  "30dias": "30 dias",
  mes_atual: "Mês atual",
  mes_anterior: "Mês anterior",
  personalizado: "Personalizado",
};

export const DATE_RANGE_PRESETS = Object.keys(DATE_RANGE_LABELS) as DateRangePreset[];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function resolveDateRange(
  preset: DateRangePreset,
  customFrom?: string | null,
  customTo?: string | null,
): { from: Date; to: Date } {
  const now = new Date();

  switch (preset) {
    case "hoje":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "7dias": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case "30dias": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case "mes_atual": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case "mes_anterior": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: startOfDay(from), to: endOfDay(to) };
    }
    case "personalizado": {
      const from = customFrom ? startOfDay(new Date(customFrom)) : startOfDay(now);
      const to = customTo ? endOfDay(new Date(customTo)) : endOfDay(now);
      return { from, to };
    }
  }
}
