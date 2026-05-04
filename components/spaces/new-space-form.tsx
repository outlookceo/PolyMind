"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, CheckCircle2, CircleDot, Loader2, Sparkles, UsersRound } from "lucide-react";

import { AgentAvatar } from "@/components/shared/agent-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/client-api";
import { discussionModes } from "@/lib/constants";
import type { AgentRecord, SpaceRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type SpaceFormState = {
  title: string;
  topic: string;
  goal: string;
  mode: (typeof discussionModes)[number];
  maxRounds: number;
  autoSummary: boolean;
};

const initialForm: SpaceFormState = {
  title: "",
  topic: "",
  goal: "",
  mode: "主持人模式",
  maxRounds: 4,
  autoSummary: true
};

export function NewSpaceForm() {
  const router = useRouter();
  const [form, setForm] = useState<SpaceFormState>(initialForm);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadAgents() {
      try {
        const data = await apiFetch<AgentRecord[]>("/api/agents");
        setAgents(data);
        setSelectedAgents(data.slice(0, 3).map((agent) => agent.id));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "加载 AI 参与者失败。");
      } finally {
        setLoadingAgents(false);
      }
    }

    void loadAgents();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!form.title.trim() || !form.topic.trim()) {
      setError("讨论空间名称和讨论主题必填。");
      return;
    }

    setSaving(true);
    try {
      const created = await apiFetch<SpaceRecord>("/api/spaces", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          agentIds: selectedAgents
        })
      });
      setNotice("讨论空间已创建。正在进入空间详情。");
      router.push(`/spaces/${created.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "创建讨论空间失败。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4">
        {[
          ["1", "定义讨论空间", "让主题、目标和背景清晰可见。"],
          ["2", "选择讨论协议", "决定 AI 如何依次发言、质疑和收敛。"],
          ["3", "编排 AI 参与者", "混合不同模型、角色和发言风格。"]
        ].map(([step, title, description], index) => (
          <div
            className={cn(
              "rounded-lg border p-4 transition",
              index === 0
                ? "border-cyan-200/24 bg-cyan-300/10"
                : "border-white/10 bg-white/[0.045]"
            )}
            key={step}
          >
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.08] text-sm text-white">
                {step}
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <form
        className="space-y-5 rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-glow"
        onSubmit={handleSubmit}
      >
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <CircleDot className="size-4 text-cyan-200" />
            基础信息
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="space-name">讨论空间名称</Label>
              <Input
                id="space-name"
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="例如：PolyMind Launch Strategy"
                value={form.title}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="space-topic">讨论主题</Label>
              <Input
                id="space-topic"
                onChange={(event) =>
                  setForm((current) => ({ ...current, topic: event.target.value }))
                }
                placeholder="这次讨论要解决什么问题？"
                value={form.topic}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="space-goal">讨论目标</Label>
            <Textarea
              id="space-goal"
              onChange={(event) =>
                setForm((current) => ({ ...current, goal: event.target.value }))
              }
              placeholder="希望最后形成哪些结论、行动或判断？"
              value={form.goal}
            />
          </div>
        </section>
        <section className="space-y-4 rounded-lg border border-white/10 bg-black/16 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="size-4 text-cyan-200" />
            讨论协议
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {discussionModes.map((mode) => (
              <button
                className={cn(
                  "rounded-lg border p-4 text-left transition hover:border-cyan-200/24 hover:bg-white/[0.06]",
                  form.mode === mode
                    ? "border-cyan-200/30 bg-cyan-300/10"
                    : "border-white/10 bg-white/[0.04]"
                )}
                key={mode}
                onClick={() => setForm((current) => ({ ...current, mode }))}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-white">{mode}</span>
                  {form.mode === mode ? <Check className="size-4 text-cyan-200" /> : null}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {mode === "辩论模式"
                    ? "鼓励不同 AI 明确提出反方和替代方案。"
                    : "适合保持讨论节奏和信息层次。"}
                </p>
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max-rounds">最大轮数：{form.maxRounds}</Label>
              <input
                className="w-full accent-cyan-300"
                id="max-rounds"
                max={8}
                min={1}
                onChange={(event) =>
                  setForm((current) => ({ ...current, maxRounds: Number(event.target.value) }))
                }
                type="range"
                value={form.maxRounds}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
              <div>
                <div className="text-sm font-medium text-white">自动总结</div>
                <div className="text-xs text-slate-500">讨论结束后生成结构化总结</div>
              </div>
              <Switch
                checked={form.autoSummary}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, autoSummary: checked }))
                }
              />
            </div>
          </div>
        </section>
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <UsersRound className="size-4 text-cyan-200" />
            选择 AI 参与者
          </div>
          {loadingAgents ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div className="h-28 animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" key={item} />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/14 bg-white/[0.035] p-6 text-center">
              <UsersRound className="mx-auto size-6 text-cyan-200" />
              <h3 className="mt-3 text-sm font-medium text-white">还没有 AI 参与者</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                可以先创建空间草稿，或先去 Agents 页面添加 AI。
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {agents.map((agent) => {
                const selected = selectedAgents.includes(agent.id);
                return (
                  <button
                    className={cn(
                      "rounded-lg border p-3 text-left transition hover:border-white/18 hover:bg-white/[0.06]",
                      selected ? "border-cyan-200/28 bg-cyan-300/10" : "border-white/10 bg-white/[0.04]"
                    )}
                    key={agent.id}
                    onClick={() =>
                      setSelectedAgents((current) =>
                        current.includes(agent.id)
                          ? current.filter((id) => id !== agent.id)
                          : [...current, agent.id]
                      )
                    }
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <AgentAvatar avatar={agent.avatar} color={agent.color} />
                      <div>
                        <div className="text-sm font-medium text-white">{agent.name}</div>
                        <div className="text-xs text-slate-500">{agent.roleTitle ?? "通用助手"}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Badge variant="outline">{agent.provider}</Badge>
                      <Badge variant="outline">{agent.model}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
        <Feedback error={error} notice={notice} />
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => router.push("/spaces")}>
            Save draft later
          </Button>
          <Button disabled={saving} type="submit">
            {saving ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {saving ? "Creating..." : "Create space"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Feedback({ error, notice }: { error: string | null; notice: string | null }) {
  if (!error && !notice) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border p-3 text-sm leading-6",
        error
          ? "border-red-300/20 bg-red-400/10 text-red-100"
          : "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
      )}
    >
      {error ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
      {error ?? notice}
    </div>
  );
}
