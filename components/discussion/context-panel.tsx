"use client";

import {
  Activity,
  Clipboard,
  FileText,
  Loader2,
  OctagonX,
  Play,
  SendHorizontal,
  Sparkles
} from "lucide-react";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { SpaceRecord } from "@/lib/types";

export function ContextPanel({
  space,
  isRunning,
  isBusy,
  selectedAgentName,
  currentRound,
  summary,
  actionItems,
  error,
  canAsk,
  canRun,
  onAskSelected,
  onRunRound,
  onSummary,
  onStop,
  onCopySummary
}: {
  space: SpaceRecord;
  isRunning: boolean;
  isBusy: boolean;
  selectedAgentName?: string;
  currentRound: number;
  summary: string;
  actionItems: string[];
  error: string | null;
  canAsk: boolean;
  canRun: boolean;
  onAskSelected: () => void;
  onRunRound: () => void;
  onSummary: () => void;
  onStop: () => void;
  onCopySummary: () => void;
}) {
  const progress = Math.min(100, Math.round((currentRound / Math.max(space.maxRounds, 1)) * 100));

  return (
    <aside className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-white/[0.052] p-4 shadow-panel backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <FileText className="size-4 text-cyan-200" />
          讨论上下文
        </div>
        <div className="space-y-3">
          <InfoBlock label="主题" value={space.topic} />
          <InfoBlock label="目标" value={space.goal ?? "还未填写讨论目标。"} />
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.052] p-4 shadow-panel backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Activity className="size-4 text-cyan-200" />
            控制面板
          </div>
          <Badge variant={isRunning ? "cyan" : "amber"}>
            {isRunning ? "Running" : "Ready"}
          </Badge>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-xs text-slate-500">
              <span>Round progress</span>
              <span>
                {currentRound} / {space.maxRounds}
              </span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric label="Mode" value={space.mode} />
            <Metric label="Members" value={`${space.memberCount}`} />
            <Metric label="Auto summary" value={space.autoSummary ? "On" : "Off"} />
            <Metric label="Status" value={space.status} />
          </div>

          {error ? (
            <div className="rounded-md border border-red-300/20 bg-red-400/10 p-3 text-xs leading-5 text-red-100">
              {error}
            </div>
          ) : null}

          <div className="grid gap-2">
            <Button disabled={!canAsk || isBusy} onClick={onAskSelected} variant="secondary">
              {isBusy ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
              点名 {selectedAgentName ?? "AI"} 发言
            </Button>
            <Button disabled={!canRun || isBusy} onClick={onRunRound}>
              {isBusy ? <Loader2 className="animate-spin" /> : <Play />}
              运行一轮讨论
            </Button>
            <Button disabled={!canRun || isBusy} onClick={onSummary} variant="secondary">
              {isBusy ? <Loader2 className="animate-spin" /> : <Sparkles />}
              生成总结
            </Button>
            <Button disabled={!isBusy} onClick={onStop} variant="outline">
              <OctagonX />
              停止当前讨论
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.052] p-4 shadow-panel backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="size-4 text-cyan-200" />
            Summary
          </div>
          <Button disabled={!summary.trim()} onClick={onCopySummary} size="sm" variant="ghost">
            <Clipboard />
            Copy
          </Button>
        </div>
        {summary.trim() ? (
          <div className="max-h-[320px] overflow-y-auto pr-1">
            <MarkdownContent className="text-xs leading-6" content={summary} />
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-white/12 bg-black/16 p-3 text-xs leading-6 text-slate-500">
            讨论结束后可以在这里生成结构化总结，包括核心结论、分歧点、最终建议和后续问题。
          </p>
        )}

        <div className="mt-4">
          <div className="mb-2 text-xs font-medium text-slate-300">行动清单</div>
          <div className="space-y-2">
            {actionItems.length > 0 ? (
              actionItems.map((item, index) => (
                <div
                  className="flex gap-2 rounded-md border border-white/10 bg-black/16 px-3 py-2 text-xs leading-5 text-slate-300"
                  key={`${item}-${index}`}
                >
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-cyan-300" />
                  {item}
                </div>
              ))
            ) : (
              <p className="text-xs leading-5 text-slate-500">暂无行动项。生成总结后会自动提取。</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/16 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <p className="mt-1 text-sm leading-6 text-slate-300">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/16 p-3">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm font-medium text-white">{value}</div>
    </div>
  );
}
