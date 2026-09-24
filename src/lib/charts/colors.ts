// Paleta categórica validada (Delta E >= 8 em pares adjacentes, ambos os
// modos) — ordem fixa, nunca ciclada nem reordenada pelos dados. Ver skill
// de dataviz (references/palette.md) para a validação completa.
export const CATEGORICAL_COLORS = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
] as const;

// Hue único para magnitude (séries temporais e rankings de uma medida só).
export const SEQUENTIAL_BLUE = "#256abf";

// Tokens neutros dos gráficos, espelhando --border/--secondary-foreground do
// design system (SVG não resolve var() de forma confiável em todo browser).
export const CHART_GRID_COLOR = "#e6e4df";
export const CHART_TEXT_COLOR = "#5b6b7c";

const CHANNEL_ORDER = ["PRESENCIAL", "RESERVA", "IFOOD", "WHATSAPP", "INSTAGRAM", "OUTRO"] as const;
const PAYMENT_METHOD_ORDER = ["PIX", "CARTAO", "DINHEIRO"] as const;

export function colorForChannel(channel: string): string {
  const index = CHANNEL_ORDER.indexOf(channel as (typeof CHANNEL_ORDER)[number]);
  return CATEGORICAL_COLORS[index >= 0 ? index : CATEGORICAL_COLORS.length - 1];
}

export function colorForPaymentMethod(method: string): string {
  const index = PAYMENT_METHOD_ORDER.indexOf(method as (typeof PAYMENT_METHOD_ORDER)[number]);
  return CATEGORICAL_COLORS[index >= 0 ? index : CATEGORICAL_COLORS.length - 1];
}
