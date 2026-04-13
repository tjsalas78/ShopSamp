import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-primary to-primary-dim text-on-primary hover:opacity-90 focus-visible:ring-primary/40",
  secondary:
    "bg-white/5 backdrop-blur-sm text-secondary border border-white/10 hover:bg-white/10 focus-visible:ring-secondary/20",
  outline:
    "bg-transparent text-secondary border border-surface-variant hover:bg-surface-container-low focus-visible:ring-secondary/20",
  ghost:
    "bg-transparent text-secondary hover:bg-white/5 focus-visible:ring-secondary/20 border-0",
  destructive:
    "bg-error text-white hover:bg-red-600 focus-visible:ring-error/40",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-7 px-3.5 text-xs gap-1.5 rounded-full",
  md: "h-9 px-5 text-sm gap-2 rounded-full",
  lg: "h-10 px-6 text-sm gap-2 rounded-full",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      children,
      disabled,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-low",
        "disabled:pointer-events-none disabled:opacity-40",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="h-3.5 w-3.5 animate-spin shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
