import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/utils";

interface TerminalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  containerClassName?: string;
}

export function TerminalInput({
  label,
  hint,
  type,
  className,
  containerClassName,
  ...props
}: TerminalInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <label className={cn("flex flex-col gap-2", containerClassName)}>
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-text-secondary">
        {label}
      </span>

      <div
        className={cn(
          "flex items-center gap-3 border border-border-hairline bg-surface-raised/80 px-3 py-3 transition-colors focus-within:border-accent-green focus-within:shadow-[0_0_0_1px_rgba(57,255,136,0.12)]",
          className,
        )}
      >
        <input
          {...props}
          type={inputType}
          className="w-full bg-transparent font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />

        {type === "password" && (
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center text-text-secondary transition-colors hover:text-text-primary"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>

      {hint && (
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-text-muted">
          {hint}
        </span>
      )}
    </label>
  );
}
