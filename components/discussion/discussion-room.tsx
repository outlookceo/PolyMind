"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CornerDownLeft,
  Loader2,
  PauseCircle,
  Play,
  SendHorizontal,
  Sparkles
} from "lucide-react";

import { AgentRail } from "@/components/discussion/agent-rail";
import { ContextPanel } from "@/components/discussion/context-panel";
import { DiscussionTimeline } from "@/components/discussion/discussion-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MessageRecord, SpaceRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type SendMode = "single" | "round";
type Operation = "ask" | "round" | "summary";

export function DiscussionRoom({
  space,
  initialMessages
}: {
  space: SpaceRecord;
  initialMessages: MessageRecord[];
}) {
  const [isRunning, setIsRunning] = useState(space.status === "RUNNING");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [sendMode, setSendMode] = useState<SendMode>("single");
  const [sending, setSending] = useState(false);
  const [activeOperation, setActiveOperation] = useState<Operation | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<string>("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingReasoning, setStreamingReasoning] = useState("");
  const [streamingError, setStreamingError] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState(() => getInitialSummary(space, initialMessages));
  const [actionItems, setActionItems] = useState(() =>
    extractActionItems(getInitialSummary(space, initialMessages))
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const spaceAgents = useMemo(
    () => space.members.filter((member) => member.enabled).map((member) => member.agent),
    [space.members]
  );
  const selectedAgent =
    spaceAgents.find((agent) => agent.id === selectedAgentId) ?? spaceAgents[0];
  const currentRound = useMemo(
    () => messages.reduce((max, message) => Math.max(max, message.roundIndex), 0),
    [messages]
  );
  const panelError = streamingError ?? roomError;
  const canAsk = Boolean(draft.trim() && selectedAgent && spaceAgents.length > 0);
  const canRun = spaceAgents.length > 0;

  async function runStreamingRequest(
    operation: Operation,
    path: string,
    body?: Record<string, unknown>
  ) {
    if (sending) return;

    const controller = new AbortController();
    let hadError = false;
    abortControllerRef.current = controller;
    setSending(true);
    setIsRunning(true);
    setActiveOperation(operation);
    setActiveAgentId("");
    setStreamingContent("");
    setStreamingReasoning("");
    setStreamingError(null);
    setRoomError(null);
    setNotice(null);

    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(payload?.error?.message ?? "AI 请求失败。");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let reading = true;

      while (reading) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\n\n/);
        buffer = events.pop() ?? "";

        for (const event of events) {
          const parsed = parseStreamEvent(event);
          if (!parsed) continue;

          if (parsed.type === "done") {
            reading = false;
          }

          if (parsed.type === "user.message") {
            setMessages((current) => appendMessage(current, parsed.message));
            setDraft("");
          }

          if (parsed.type === "agent.started") {
            setActiveAgentId(parsed.agent.id);
            setStreamingContent("");
            setStreamingReasoning("");
            setStreamingError(null);
          }

          if (parsed.type === "delta") {
            setStreamingContent((current) => current + (parsed.content ?? ""));
            setStreamingReasoning((current) => current + (parsed.reasoningContent ?? ""));
          }

          if (parsed.type === "agent.completed") {
            setMessages((current) => appendMessage(current, parsed.message));
            if (parsed.message.senderType === "SUMMARY") {
              setSummaryText(parsed.message.content);
              setActionItems(extractActionItems(parsed.message.content));
            }
            setStreamingContent("");
            setStreamingReasoning("");
            setStreamingError(null);
            setActiveAgentId("");
          }

          if (parsed.type === "summary.completed") {
            setSummaryText(parsed.summary);
            setActionItems(parsed.actionItems.length > 0 ? parsed.actionItems : extractActionItems(parsed.summary));
          }

          if (parsed.type === "error") {
            hadError = true;
            const message = parsed.error?.message ?? "Provider 调用失败。";
            if (parsed.agentId) {
              setActiveAgentId(parsed.agentId);
              setStreamingError(message);
            } else {
              setRoomError(message);
            }
          }
        }
      }
    } catch (error) {
      hadError = true;
      const message =
        error instanceof DOMException && error.name === "AbortError"
          ? "已停止当前讨论。已输出但未完成的内容不会保存为普通消息。"
          : error instanceof Error
            ? error.message
            : "AI 请求失败。";
      if (error instanceof DOMException && error.name === "AbortError") {
        setNotice(message);
      } else {
        setRoomError(message);
      }
    } finally {
      if (!hadError) {
        setActiveAgentId("");
      }
      setSending(false);
      setIsRunning(false);
      setActiveOperation(null);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }

  async function handleAskAgent() {
    const userMessage = draft.trim();
    if (!selectedAgent) {
      setRoomError("当前讨论空间没有可用 AI 参与者。");
      return;
    }
    if (!userMessage) {
      setRoomError("请输入要点名讨论的问题。");
      return;
    }

    await runStreamingRequest("ask", `/api/spaces/${space.id}/ask-agent`, {
      agentId: selectedAgent.id,
      userMessage
    });
  }

  async function handleRunRound() {
    if (spaceAgents.length === 0) {
      setRoomError("当前讨论空间没有可用 AI 参与者。");
      return;
    }

    const userMessage = draft.trim();
    await runStreamingRequest(
      "round",
      `/api/spaces/${space.id}/run-round`,
      userMessage ? { userMessage } : {}
    );
  }

  async function handleSummary() {
    if (spaceAgents.length === 0) {
      setRoomError("当前讨论空间没有可用 AI 参与者。");
      return;
    }

    await runStreamingRequest("summary", `/api/spaces/${space.id}/summary`, {
      summaryAgentId: selectedAgent?.id
    });
  }

  async function handleSubmit() {
    if (sendMode === "round") {
      await handleRunRound();
      return;
    }
    await handleAskAgent();
  }

  function handleStop() {
    abortControllerRef.current?.abort();
  }

  async function handleCopySummary() {
    if (!summaryText.trim()) return;
    try {
      await navigator.clipboard.writeText(summaryText);
      setNotice("已复制总结 Markdown。");
    } catch {
      setRoomError("复制失败，请检查浏览器剪贴板权限。");
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] shadow-glow backdrop-blur-xl">
        <div className="relative p-4 sm:p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(34,211,238,0.12),transparent_42%),radial-gradient(ellipse_at_92%_20%,rgba(96,165,250,0.10),transparent_36%)]" />
          <div className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="cyan">{space.mode}</Badge>
                <Badge variant={isRunning ? "blue" : "outline"}>
                  {isRunning ? "Streaming" : "Ready"}
                </Badge>
                <span className="text-xs text-slate-500">
                  Round {currentRound} / {space.maxRounds}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-normal text-white">
                {space.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{space.topic}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={sending || spaceAgents.length === 0}
                onClick={() => void handleRunRound()}
                variant="secondary"
              >
                {activeOperation === "round" ? <Loader2 className="animate-spin" /> : <Play />}
                Run round
              </Button>
              <Button
                disabled={sending || spaceAgents.length === 0}
                onClick={() => void handleSummary()}
              >
                {activeOperation === "summary" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Sparkles />
                )}
                Summary
              </Button>
              <Button disabled={!sending} onClick={handleStop} variant="outline">
                <PauseCircle />
                Stop
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <AgentRail
          activeAgentId={activeAgentId}
          agents={spaceAgents}
          onSelectAgent={setSelectedAgentId}
          selectedAgentId={selectedAgent?.id ?? ""}
        />
        <div className="min-h-[740px] overflow-hidden rounded-lg border border-white/10 bg-[#0D1017]/92 shadow-panel">
          <DiscussionTimeline
            agents={spaceAgents}
            messages={messages}
            onPickSuggestion={setDraft}
            space={space}
            streaming={
              activeAgentId
                ? {
                    agentId: activeAgentId,
                    content: streamingContent,
                    reasoningContent: streamingReasoning,
                    error: streamingError
                  }
                : undefined
            }
          />

          <div className="border-t border-white/10 bg-[#090B10]/80 p-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <Textarea
                className="min-h-[84px] resize-none border-0 bg-transparent p-0 shadow-none focus:ring-0"
                disabled={sending}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSubmit();
                  }
                }}
                placeholder="输入新的上下文、问题或观点。Enter 发送，Shift + Enter 换行。"
                value={draft}
              />
              <div className="mt-3 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="inline-flex rounded-md border border-white/10 bg-black/18 p-1">
                    {[
                      ["single", "只让一个 AI 回答"],
                      ["round", "让所有 AI 轮流讨论"]
                    ].map(([value, label]) => (
                      <button
                        className={cn(
                          "rounded px-2.5 py-1.5 text-xs transition",
                          sendMode === value
                            ? "bg-cyan-300/12 text-cyan-100"
                            : "text-slate-500 hover:text-slate-300"
                        )}
                        disabled={sending}
                        key={value}
                        onClick={() => setSendMode(value as SendMode)}
                        type="button"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <select
                    className="h-9 min-w-0 rounded-md border border-white/10 bg-white/[0.055] px-2 text-xs text-foreground outline-none transition focus:border-cyan-200/30 focus:ring-2 focus:ring-cyan-300/10 disabled:opacity-50"
                    disabled={sending || spaceAgents.length === 0 || sendMode === "round"}
                    onChange={(event) => setSelectedAgentId(event.target.value)}
                    value={selectedAgent?.id ?? ""}
                  >
                    {spaceAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} · {agent.provider} · {agent.model}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    {sendMode === "single"
                      ? "点名对象会流式回复并保存消息。"
                      : "会按左侧顺序让最多 6 个 AI 依次发言。"}
                  </p>
                </div>

                <Button
                  disabled={sending || (sendMode === "single" ? !canAsk : spaceAgents.length === 0)}
                  onClick={() => void handleSubmit()}
                  size="sm"
                >
                  {sending ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
                  {sendMode === "single" ? "Ask AI" : "Run round"}
                  <CornerDownLeft className="hidden size-3.5 opacity-60 sm:block" />
                </Button>
              </div>
              {notice ? (
                <p className="mt-3 text-xs text-cyan-200">{notice}</p>
              ) : panelError ? (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-red-300/20 bg-red-400/10 p-3 text-xs leading-5 text-red-100">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  {panelError}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <ContextPanel
          actionItems={actionItems}
          canAsk={canAsk}
          canRun={canRun}
          currentRound={currentRound}
          error={panelError}
          isBusy={sending}
          isRunning={isRunning}
          onAskSelected={() => void handleAskAgent()}
          onCopySummary={() => void handleCopySummary()}
          onRunRound={() => void handleRunRound()}
          onStop={handleStop}
          onSummary={() => void handleSummary()}
          selectedAgentName={selectedAgent?.name}
          space={space}
          summary={summaryText}
        />
      </div>
    </div>
  );
}

function parseStreamEvent(event: string): StreamEvent | null {
  const line = event
    .split(/\r?\n/)
    .find((item) => item.startsWith("data:"));
  if (!line) return null;

  try {
    return JSON.parse(line.slice(5).trim()) as StreamEvent;
  } catch {
    return null;
  }
}

function appendMessage(messages: MessageRecord[], message: MessageRecord) {
  if (messages.some((item) => item.id === message.id)) return messages;
  return [...messages, message];
}

function getInitialSummary(space: SpaceRecord, messages: MessageRecord[]) {
  return (
    [...messages].reverse().find((message) => message.senderType === "SUMMARY")?.content ??
    space.summary ??
    ""
  );
}

function extractActionItems(summary: string) {
  const lines = summary
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const actionHeaderIndex = lines.findIndex((line) => /行动|action/i.test(line));
  const sourceLines = actionHeaderIndex >= 0 ? lines.slice(actionHeaderIndex + 1) : lines;

  return sourceLines
    .filter((line) => /^([-*]|\d+\.)\s+/.test(line))
    .map((line) => line.replace(/^([-*]|\d+\.)\s+/, "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

type StreamEvent =
  | { type: "done" }
  | { type: "user.message"; message: MessageRecord }
  | { type: "agent.started"; agent: { id: string; name: string } }
  | { type: "delta"; agentId: string; content?: string; reasoningContent?: string }
  | { type: "agent.completed"; agentId: string; message: MessageRecord }
  | { type: "summary.completed"; summary: string; actionItems: string[] }
  | { type: "error"; agentId?: string; error?: { message?: string } };
