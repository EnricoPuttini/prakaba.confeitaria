import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "success" | "warning" | "error";

const TONE_ICON_STYLES: Record<Tone, string> = {
  neutral: "bg-surface-muted text-secondary-foreground",
  primary: "bg-primary-subtle text-primary",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  error: "bg-error-subtle text-error",
};

function HealthCard({
  icon: Icon,
  tone,
  label,
  value,
  caption,
}: {
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
  label: string;
  value: string | number;
  caption: string;
}) {
  return (
    <Card variant="alert" tone={tone}>
      <CardContent className="flex items-start gap-3 p-5">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            TONE_ICON_STYLES[tone],
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-secondary-foreground">{label}</p>
          <p className="text-xl font-semibold text-foreground">{value}</p>
          <p className="text-xs text-secondary-foreground">{caption}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export { HealthCard };
