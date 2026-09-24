import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "success" | "warning" | "error";

const TONE_BAR_COLORS: Record<Tone, string> = {
  neutral: "bg-secondary-foreground/40",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
};

function Progress({
  value,
  max = 100,
  tone = "primary",
  className,
}: {
  value: number;
  max?: number;
  tone?: Tone;
  className?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-all", TONE_BAR_COLORS[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export { Progress };
