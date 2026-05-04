"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Bot, MessageSquarePlus, Sparkles, UserRound, UsersRound } from "lucide-react";

import { AgentAvatar } from "@/components/shared/agent-avatar";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/client-api";
import type { AgentRecord, MessageRecord, SpaceRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DiscussionTimeline({
  agents,
  messages,
  space,
  streaming,
  onPickSuggestion
}: {
  agents: AgentRecord[];
  messages: MessageRecord[];
  space: SpaceRecord;
  streaming?: {
    agentId: string;
    content: string;
    reasoningContent?: string;
    error?: string | null;
  };
  onPickSuggestion: (suggestion: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);
  const grouped = useMemo(
    () =>
      messages.reduce<Record<number, MessageRecord[]>>((acc, message) => {
        acc[message.roundIndex] = [...(acc[message.roundIndex] ?? []), message];
        return acc;
      }, {}),
    [messages]
  );

  useEffect(() => {
    if (!stickToBottom) return;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages.length, streaming?.content, streaming?.reasoningContent, stickToBottom]);

  function handleScroll() {
    const node = scrollRef.current;
    if (!node) return;
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    setStickToBottom(distance < 120);
  }

  if (messages.length === 0 && !streaming) {
    return (
      <div className="min-h-[640px] overflow-y-auto p-5 sm:p-6">
        <EmptyState agents={agents} onPickSuggestion={onPickSuggestion} space={space} />
      </div>
    );
  }

  return (
    <div className="max-h-[680px] overflow-y-auto p-4 sm:p-5" onScroll={handleScroll} ref={scrollRef}>
      {Object.entries(grouped).map(([round, roundMessages]) => (
        <div className="mb-6" key={round}>
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <Badge variant={round === "0" ? "outline" : "cyan"}>Round {round}</Badge>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="space-y-4">
            {roundMessages.map((message, index) => (
              <TimelineMessage
                agent={agents.find((item) => item.id === message.senderAgentId)}
                index={index}
                key={message.id}
                message={message}
              />
            ))}
          </div>
        </div>
      ))}
      {streaming ? (
        <StreamingMessage
          agent={agents.find((item) => item.id === streaming.agentId)}
          content={streaming.content}
          error={streaming.error}
          reasoningContent={streaming.reasoningContent}
        />
      ) : null}
    </div>
  );
}

function EmptyState({
  agents,
  space,
  onPickSuggestion
}: {
  agents: AgentRecord[];
  space: SpaceRecord;
  onPickSuggestion: (suggestion: string) => void;
}) {
  const suggestions = [
    "请先分别从产品、技术和风险角度评估这个主题。",
    "请让参与者先提出关键假设，再互相质疑。",
    "请产出一个可执行方案，并指出下一步验证方式。"
  ];

  return (
    <div className="flex min-h-[600px] items-center justify-center">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl text-center"
        initial={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.35 }}
      >
        <div className="relative mx-auto flex size-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-200/20 bg-cyan-300/10 blur-sm" />
          <div className="absolute inset-3 rounded-full border border-blue-200/10 bg-blue-300/10" />
          <Sparkles className="relative size-7 text-cyan-100" />
        </div>
        <h3 className="mt-5 text-xl font-semibold tracking-normal text-white">{space.title}</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">
          这里会逐步形成一条多 AI 讨论轨迹。输入第一条上下文后，可以点名某个 AI 回答，
          也可以让所有参与者按顺序推进讨论。
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          {suggestions.map((suggestion) => (
            <button
              className="rounded-lg border border-white/10 bg-white/[0.045] p-3 text-left text-xs leading-5 text-slate-300 transition hover:-translate-y-0.5 hover:border-cyan-200/25 hover:bg-cyan-300/[0.07]"
              key={suggestion}
              onClick={() => onPickSuggestion(suggestion)}
              type="button"
            >
              <MessageSquarePlus className="mb-2 size-4 text-cyan-200" />
              {suggestion}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-white/10 bg-black/18 p-4">
          <div className="mb-3 flex items-center justify-center gap-2 text-xs font-medium text-slate-300">
            <UsersRound className="size-4 text-cyan-200" />
            已加入的 AI
          </div>
          {agents.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2">
              {agents.map((agent) => (
                <span
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.055] px-2.5 py-1.5 text-xs text-slate-300"
                  key={agent.id}
                >
                  <AgentAvatar avatar={agent.avatar} className="size-6 rounded" color={agent.color} />
                  {agent.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-6 text-slate-500">
              当前空间还没有 AI 参与者。先创建并加入 AI 后再开始讨论。
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StreamingMessage({
  agent,
  content,
  reasoningContent,
  error
}: {
  agent?: AgentRecord;
  content: string;
  reasoningContent?: string;
  error?: string | null;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-cyan-200/24 bg-cyan-300/[0.07] p-4 shadow-[0_0_38px_rgba(34,211,238,0.08)]"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25 }}
    >
      <MessageHeader
        agent={agent}
        badge={error ? "Error" : "Streaming"}
        badgeVariant={error ? "amber" : "cyan"}
        fallback="AI"
        icon={<Bot className="size-4" />}
        timeLabel="now"
      />

      {reasoningContent ? <ReasoningDisclosure content={reasoningContent} /> : null}

      {error ? (
        <p className="mt-4 rounded-md border border-red-300/20 bg-red-400/10 p-3 text-sm leading-6 text-red-100">
          {error}
        </p>
      ) : content ? (
        <MarkdownContent className="mt-4 max-w-3xl" content={content} />
      ) : (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
          <span>正在连接 Provider</span>
          <TypingDots />
        </div>
      )}
    </motion.div>
  );
}

function TimelineMessage({
  message,
  agent,
  index
}: {
  message: MessageRecord;
  agent?: AgentRecord;
  index: number;
}) {
  const isUser = message.senderType === "USER";
  const isSummary = message.senderType === "SUMMARY";

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        isUser
          ? "ml-auto max-w-[88%] border-blue-300/20 bg-blue-400/[0.08]"
          : isSummary
            ? "border-amber-300/22 bg-amber-300/[0.07]"
            : "border-white/10 bg-white/[0.045]"
      )}
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
    >
      <MessageHeader
        agent={agent}
        badge={message.senderType}
        badgeVariant={isSummary ? "amber" : isUser ? "blue" : "outline"}
        fallback={isUser ? "You" : isSummary ? "Summary" : "AI"}
        icon={isSummary ? <Sparkles className="size-4" /> : <UserRound className="size-4" />}
        timeLabel={formatDateTime(message.createdAt)}
      />

      <MarkdownContent className="mt-4 max-w-3xl" content={message.content} />

      {getReasoningContent(message) ? (
        <ReasoningDisclosure content={getReasoningContent(message) ?? ""} />
      ) : null}
    </motion.div>
  );
}

function MessageHeader({
  agent,
  fallback,
  icon,
  badge,
  badgeVariant,
  timeLabel
}: {
  agent?: AgentRecord;
  fallback: string;
  icon: ReactNode;
  badge: string;
  badgeVariant: "default" | "blue" | "cyan" | "green" | "amber" | "rose" | "outline";
  timeLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {agent ? (
          <AgentAvatar avatar={agent.avatar} color={agent.color} />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.08] text-slate-100">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-white">{agent?.name ?? fallback}</h3>
            {agent ? <ProviderBadge provider={agent.provider} /> : null}
            {agent ? <Badge variant="outline">{agent.model}</Badge> : null}
            <Badge variant={badgeVariant}>{badge}</Badge>
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">
            {agent ? agent.roleTitle ?? "通用讨论者" : fallback === "You" ? "用户输入" : "系统消息"} ·{" "}
            {timeLabel}
          </p>
        </div>
      </div>
    </div>
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

function ReasoningDisclosure({ content }: { content: string }) {
  return (
    <details className="mt-4 rounded-md border border-white/10 bg-black/18 px-3 py-2 text-xs text-slate-400">
      <summary className="cursor-pointer text-cyan-100">思考过程</summary>
      <p className="mt-2 whitespace-pre-wrap leading-6">{content}</p>
    </details>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((item) => (
        <span
          className="size-1.5 animate-pulse rounded-full bg-cyan-200/80"
          key={item}
          style={{ animationDelay: `${item * 120}ms` }}
        />
      ))}
    </span>
  );
}

function getReasoningContent(message: MessageRecord) {
  const metadata = message.metadataJson as { reasoningContent?: string } | null;
  return metadata?.reasoningContent;
}
