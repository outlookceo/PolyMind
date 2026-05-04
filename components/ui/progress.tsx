import * as React from "react";

import { cn } from "@/lib/utils";

function Progress({
  value = 0,
  className
}: {
  value?: number;
  className?: string;
}) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/8", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export { Progress };
