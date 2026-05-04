import Link from "next/link";
import { BrainCircuit } from "lucide-react";

import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-9 items-center justify-center rounded-md border border-cyan-300/25 bg-cyan-300/10 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.16)]">
        <BrainCircuit className="size-4" />
      </span>
      <span className="text-sm font-semibold tracking-normal text-white">PolyMind</span>
    </Link>
  );
}
