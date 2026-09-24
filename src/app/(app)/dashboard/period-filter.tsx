"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DATE_RANGE_LABELS, DATE_RANGE_PRESETS, type DateRangePreset } from "@/lib/reports/date-range";

export function PeriodFilter({
  current,
  from,
  to,
}: {
  current: DateRangePreset;
  from?: string;
  to?: string;
}) {
  const [preset, setPreset] = useState<DateRangePreset>(current);

  return (
    <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
      {DATE_RANGE_PRESETS.map((option) => (
        <label key={option} className="cursor-pointer">
          <input
            type="radio"
            name="period"
            value={option}
            defaultChecked={option === current}
            className="peer sr-only"
            onChange={() => setPreset(option)}
          />
          <span className="inline-block rounded-md border border-border bg-surface px-3 py-2 text-sm text-secondary-foreground shadow-xs transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
            {DATE_RANGE_LABELS[option]}
          </span>
        </label>
      ))}

      {preset === "personalizado" && (
        <>
          <Input type="date" name="from" defaultValue={from} className="w-40" />
          <Input type="date" name="to" defaultValue={to} className="w-40" />
        </>
      )}

      <Button type="submit" variant="secondary" size="sm">
        Aplicar
      </Button>
    </form>
  );
}
