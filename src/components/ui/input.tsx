import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-7 w-full rounded-md border border-border-default bg-surface-2",
          "px-2.5 py-1.5 text-sm text-text-primary",
          "placeholder:text-text-disabled",
          "transition-colors duration-75",
          "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
