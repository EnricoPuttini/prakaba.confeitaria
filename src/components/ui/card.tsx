import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-lg border bg-surface transition-shadow", {
  variants: {
    variant: {
      default: "border-border shadow-sm",
      elevated: "border-border shadow-md",
      flat: "border-border shadow-none",
      alert: "border border-l-4 shadow-sm",
    },
    tone: {
      neutral: "",
      primary: "",
      success: "",
      warning: "",
      error: "",
    },
  },
  compoundVariants: [
    { variant: "alert", tone: "neutral", className: "border-l-border" },
    { variant: "alert", tone: "primary", className: "border-l-primary bg-primary-subtle/40" },
    { variant: "alert", tone: "success", className: "border-l-success bg-success-subtle/50" },
    { variant: "alert", tone: "warning", className: "border-l-warning bg-warning-subtle/50" },
    { variant: "alert", tone: "error", className: "border-l-error bg-error-subtle/50" },
  ],
  defaultVariants: {
    variant: "default",
    tone: "neutral",
  },
});

function Card({
  className,
  variant,
  tone,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return <div className={cn(cardVariants({ variant, tone }), className)} {...props} />;
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3 className={cn("font-brand text-xl font-semibold text-foreground", className)} {...props} />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-secondary-foreground", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants };
