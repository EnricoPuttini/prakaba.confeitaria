function escapeCsvValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",;\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Separador ";" porque o Excel em pt-BR usa "," como separador decimal.
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  const lines = [headers.map(escapeCsvValue).join(";"), ...rows.map((row) => row.map(escapeCsvValue).join(";"))];
  // BOM para o Excel reconhecer UTF-8 (acentos) corretamente.
  return "﻿" + lines.join("\r\n");
}

export function csvResponse(filename: string, csv: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
