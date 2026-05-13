import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors duration-75",
  {
    variants: {
      variant: {
        default:  "bg-accent-subtle text-accent-text border border-accent/10",
        outline:  "border border-border-default text-text-secondary bg-transparent",
        muted:    "bg-surface-3 text-text-muted border border-border-subtle",
        danger:   "bg-destructive-bg text-destructive border border-destructive/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
