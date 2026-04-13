import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef, ReactNode, useState } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix" | "suffix"> {
  label?: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, prefix, suffix, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="type-label">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-secondary text-sm pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded bg-surface-low border-0 px-3 py-2 text-sm text-on-surface placeholder-secondary/50",
            "transition-shadow focus:outline-none focus:ring-1 focus:ring-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "ring-1 ring-error focus:ring-error",
            prefix && "pl-7",
            suffix && "pr-8",
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-secondary text-sm pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-2xs text-error">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

// Eye icon — visible
function EyeOpen() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 3C4.5 3 1.5 5.5 0 8c1.5 2.5 4.5 5 8 5s6.5-2.5 8-5c-1.5-2.5-4.5-5-8-5zm0 8a3 3 0 110-6 3 3 0 010 6zm0-1.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
    </svg>
  );
}

// Eye icon — hidden
function EyeOff() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.5 1.5l13 13M6.5 6.56A3 3 0 0110.5 10.5m-5-7C3.2 4.7 1.5 6.2 0 8c1.5 2.5 4.5 5 8 5 1.2 0 2.3-.3 3.3-.7M8 3c3.5 0 6.5 2.5 8 5-.6 1-1.4 2-2.5 2.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="type-label">{label}</label>
        )}
        <div className="relative flex items-center">
          <input
            ref={ref}
            id={id}
            type={show ? "text" : "password"}
            className={cn(
              "w-full rounded bg-surface-low border-0 px-3 py-2 pr-9 text-sm text-on-surface placeholder-secondary/50",
              "transition-shadow focus:outline-none focus:ring-1 focus:ring-primary",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "ring-1 ring-error focus:ring-error",
              className
            )}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            className="absolute right-2.5 text-secondary hover:text-on-surface transition-colors"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff /> : <EyeOpen />}
          </button>
        </div>
        {error && <p className="text-2xs text-error">{error}</p>}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="type-label">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={cn(
            "w-full appearance-none rounded bg-surface-low border-0 px-3 py-2 pr-8 text-sm text-on-surface",
            "transition-shadow focus:outline-none focus:ring-1 focus:ring-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "ring-1 ring-error focus:ring-error",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary">
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      {error && <p className="text-2xs text-error">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";
