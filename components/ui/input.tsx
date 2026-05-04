import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-white/10 bg-white/[0.055] px-3 py-2 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition placeholder:text-muted-foreground focus:border-blue-300/35 focus:ring-2 focus:ring-blue-400/15 disabled:cursor-not-allowed disabled:opacity-50",
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
