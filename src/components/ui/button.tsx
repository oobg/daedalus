import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-75 focus-ring disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        primary:   "bg-accent text-white hover:bg-accent-hover active:bg-accent-hover",
        secondary: "bg-surface-3 text-text-primary hover:bg-border-subtle border border-border-default",
        ghost:     "text-text-secondary hover:bg-surface-3 hover:text-text-primary",
        outline:   "border border-border-default bg-transparent text-text-secondary hover:bg-surface-3 hover:text-text-primary",
        subtle:    "bg-accent-subtle text-accent-text hover:bg-accent/15",
        danger:    "text-destructive border border-destructive/20 hover:bg-destructive-bg",
      },
      size: {
        xs:   "h-6 px-2 text-[11px] rounded",
        sm:   "h-7 px-2.5 text-xs",
        md:   "h-8 px-3 text-sm",
        lg:   "h-9 px-4 text-sm",
        icon: "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "sm",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
