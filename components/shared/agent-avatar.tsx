import { cn } from "@/lib/utils";
import type { AgentTone } from "@/lib/agent-tone";

const toneClasses: Record<AgentTone, string> = {
  blue: "border-blue-300/25 bg-blue-400/12 text-blue-100 shadow-[0_0_24px_rgba(96,165,250,0.16)]",
  cyan: "border-cyan-300/25 bg-cyan-400/12 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.14)]",
  green:
    "border-emerald-300/25 bg-emerald-400/12 text-emerald-100 shadow-[0_0_24px_rgba(74,222,128,0.14)]",
  amber:
    "border-amber-300/25 bg-amber-400/12 text-amber-100 shadow-[0_0_24px_rgba(245,158,11,0.14)]",
  rose: "border-rose-300/25 bg-rose-400/12 text-rose-100 shadow-[0_0_24px_rgba(251,113,133,0.14)]",
  slate: "border-slate-300/18 bg-slate-400/10 text-slate-100"
};

export function AgentAvatar({
  avatar,
  color,
  className
}: {
  avatar: string;
  color: AgentTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-md border text-sm font-semibold",
        toneClasses[color],
        className
      )}
    >
      {avatar}
    </div>
  );
}
