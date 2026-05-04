import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[112px] w-full rounded-md border border-white/10 bg-white/[0.055] px-3 py-2.5 text-sm leading-6 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition placeholder:text-muted-foreground focus:border-blue-300/35 focus:ring-2 focus:ring-blue-400/15 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
