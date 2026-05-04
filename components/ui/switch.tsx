"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Switch({
  checked,
  onCheckedChange,
  className,
  ...props
}: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange">) {
  const [internalChecked, setInternalChecked] = React.useState(Boolean(checked));
  const isControlled = typeof checked === "boolean";
  const current = isControlled ? checked : internalChecked;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={current}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full border border-white/10 bg-white/10 p-0.5 transition data-[state=checked]:border-cyan-300/30 data-[state=checked]:bg-cyan-400/25",
        className
      )}
      data-state={current ? "checked" : "unchecked"}
      onClick={() => {
        const next = !current;
        if (!isControlled) setInternalChecked(next);
        onCheckedChange?.(next);
      }}
      {...props}
    >
      <span
        className={cn(
          "size-5 rounded-full bg-white shadow transition-transform",
          current ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export { Switch };
