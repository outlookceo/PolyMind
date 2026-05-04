"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, Bot, Plus, Radio } from "lucide-react";

import { AgentAvatar } from "@/components/shared/agent-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AgentRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AgentRail({
  agents,
  activeAgentId,
  selectedAgentId,
  onSelectAgent
}: {
  agents: AgentRecord[];
  activeAgentId: string;
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
}) {
  return (
    <aside className="rounded-lg border border-white/10 bg-white/[0.052] p-4 shadow-panel backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">AI 参与者</h2>
          <p className="mt-1 text-xs text-slate-500">{agents.length} agents in this space</p>
        </div>
        <Button asChild size="icon" variant="ghost" aria-label="Create AI participant">
          <Link href="/agents/new">
            <Plus />
          </Link>
        </Button>
      </div>
      <div className="space-y-3">
        {agents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/14 bg-white/[0.035] p-4 text-xs leading-5 text-slate-400">
            这个空间还没有 AI 参与者。先创建 AI，再在新建讨论空间时选择它们加入。
          </div>
        ) : null}
        {agents.map((agent, index) => {
          const speaking = activeAgentId === agent.id;
          const selected = selectedAgentId === agent.id;

          return (
            <motion.button
              animate={{ opacity: 1, x: 0 }}
              aria-pressed={selected}
              className={cn(
                "group w-full rounded-lg border p-3 text-left transition duration-200",
                "hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]",
                selected || speaking
                  ? "border-cyan-200/30 bg-cyan-300/10 shadow-[0_0_34px_rgba(34,211,238,0.09)]"
                  : "border-white/10 bg-[#11141B]/72"
              )}
              initial={{ opacity: 0, x: -8 }}
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              transition={{ duration: 0.22, delay: index * 0.035 }}
              type="button"
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <AgentAvatar
                    avatar={agent.avatar}
                    className={cn(speaking ? "ring-2 ring-cyan-200/40" : "ring-1 ring-white/5")}
                    color={agent.color}
                  />
                  {speaking ? (
                    <span className="absolute -right-0.5 -top-0.5 flex size-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-55" />
                      <span className="relative inline-flex size-3 rounded-full border border-[#0D1017] bg-cyan-300" />
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-medium text-white">{agent.name}</h3>
                    {speaking ? (
                      <span className="flex items-center gap-1 text-[11px] text-cyan-200">
                        <Activity className="size-3" />
                        typing
                      </span>
                    ) : selected ? (
                      <span className="flex items-center gap-1 text-[11px] text-blue-200">
                        <Radio className="size-3" />
                        target
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {agent.roleTitle ?? "通用讨论者"}
                  </p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-400">
                {agent.persona ?? "未配置人设，将使用默认通用助手 prompt。"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ProviderBadge provider={agent.provider} />
                <Badge className="max-w-full truncate" variant="outline">
                  {agent.model}
                </Badge>
              </div>
            </motion.button>
          );
        })}
      </div>
      <div className="mt-4 rounded-md border border-white/10 bg-black/16 p-3 text-xs leading-5 text-slate-400">
        <div className="mb-2 flex items-center gap-2 text-slate-300">
          <Bot className="size-3.5 text-cyan-200" />
          Default behavior
        </div>
        未配置角色的 AI 会以“通用讨论者”身份发言，保持清晰、准确、建设性。
      </div>
    </aside>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  const normalized = provider.toLowerCase();
  const variant: "blue" | "cyan" | "green" | "amber" | "outline" =
    normalized.includes("deepseek")
      ? "blue"
      : normalized.includes("kimi")
        ? "cyan"
        : normalized.includes("minimax")
          ? "amber"
          : normalized.includes("openai")
            ? "green"
            : "outline";

  return <Badge variant={variant}>{provider}</Badge>;
}
