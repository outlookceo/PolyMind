import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-white/10 bg-white/[0.08] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        blue: "border-blue-400/20 bg-blue-400/10 text-blue-200",
        cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
        green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
        amber: "border-amber-400/20 bg-amber-400/10 text-amber-200",
        rose: "border-rose-400/20 bg-rose-400/10 text-rose-200",
        outline: "border-white/12 bg-transparent text-muted-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
