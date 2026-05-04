"use client";

import Link from "next/link";
import { AlertCircle, Edit3, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AgentAvatar } from "@/components/shared/agent-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/client-api";
import type { AgentRecord } from "@/lib/types";

export function AgentGrid() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAgents() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AgentRecord[]>("/api/agents");
      setAgents(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载 AI 参与者失败。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAgents();
  }, []);

  async function handleDelete(id: string) {
    setError(null);
    try {
      await apiFetch<{ deleted: boolean }>(`/api/agents/${id}`, { method: "DELETE" });
      setAgents((current) => current.filter((agent) => agent.id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除 AI 参与者失败。");
    }
  }

  if (loading) {
    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            className="h-[280px] animate-pulse rounded-lg border border-white/10 bg-white/[0.04]"
            key={item}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">
          <AlertCircle className="size-4" />
          {error}
        </div>
      ) : null}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <Card
            className="group overflow-hidden bg-white/[0.052] transition hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.068]"
            key={agent.id}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AgentAvatar avatar={agent.avatar} className="size-12" color={agent.color} />
                  <div>
                    <h2 className="text-base font-semibold text-white">{agent.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {agent.roleTitle ?? "通用助手"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" aria-label={`Edit ${agent.name}`}>
                    <Edit3 />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${agent.name}`}
                    onClick={() => void handleDelete(agent.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <p className="mt-5 min-h-[64px] text-sm leading-6 text-slate-300">
                {agent.persona ??
                  "未配置人设。后续讨论时将使用默认通用助手设定，保持清晰、准确、建设性。"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline">{agent.provider}</Badge>
                <Badge variant="outline">{agent.model}</Badge>
                <Badge variant={agent.color === "slate" ? "outline" : agent.color}>
                  temp {agent.temperature}
                </Badge>
                {agent.isDefault ? <Badge variant="cyan">Default</Badge> : null}
              </div>
              <div className="mt-5 rounded-md border border-white/10 bg-black/16 p-3">
                <div className="text-xs text-slate-500">发言风格</div>
                <div className="mt-1 text-sm text-slate-300">
                  {agent.speakingStyle ?? "默认：平衡、清楚、不过度假设"}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Link
          className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-white/14 bg-white/[0.035] p-6 text-center transition hover:border-cyan-200/24 hover:bg-cyan-300/8"
          href="/agents/new"
        >
          <div className="flex size-11 items-center justify-center rounded-md border border-cyan-200/20 bg-cyan-300/10 text-cyan-100">
            <Plus className="size-5" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-white">Create a new AI participant</h3>
          <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
            可只填写模型配置，角色、人设和背景都可以留空。
          </p>
        </Link>
        {agents.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] p-6 text-center">
            <Loader2 className="size-6 text-cyan-200" />
            <h3 className="mt-4 text-sm font-semibold text-white">还没有 AI 参与者</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              创建第一个 AI 后，就可以把它加入讨论空间。
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
