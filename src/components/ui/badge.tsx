import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type BadgeVariant = "success" | "warning" | "error" | "neutral";

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error:   "bg-error/10 text-error",
  neutral: "bg-surface-variant text-secondary",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "neutral", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-2xs font-medium uppercase tracking-widest",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {variant === "success" && (
        <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
      )}
      {variant === "warning" && (
        <span className="h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
      )}
      {variant === "error" && (
        <span className="h-1.5 w-1.5 rounded-full bg-error shrink-0" />
      )}
      {children}
    </span>
  );
}
