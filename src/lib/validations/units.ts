export const unitOptions = ["UNIDADE", "GRAMA", "QUILOGRAMA", "ML", "LITRO"] as const;

export const UNIT_LABELS: Record<(typeof unitOptions)[number], string> = {
  UNIDADE: "unidade",
  GRAMA: "grama (g)",
  QUILOGRAMA: "quilograma (kg)",
  ML: "mililitro (ml)",
  LITRO: "litro (L)",
};
