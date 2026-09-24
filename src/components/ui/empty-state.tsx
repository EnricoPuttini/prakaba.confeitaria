import * as React from "react";
import { cn } from "@/lib/utils";

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-secondary-foreground">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="font-brand text-base font-semibold text-foreground">{title}</p>
        {description && (
          <p className="max-w-sm text-sm text-secondary-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export { EmptyState };
