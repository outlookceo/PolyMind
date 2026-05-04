import type { AiAgent, DiscussionMessage, DiscussionSpace, ProviderKey, SpaceMember } from "@prisma/client";

import type { ChatMessage } from "@/server/ai/providers/types";
import { DISCUSSION_LIMITS } from "@/server/ai/safety/limits";
import { summarizeHistory } from "@/server/ai/context/summarize-history";

type AgentWithKey = AiAgent & { providerKey?: Pick<ProviderKey, "keyName"> | null };
type MemberWithAgent = SpaceMember & { agent: AgentWithKey };

export function buildDiscussionContext({
  space,
  agent,
  members,
  messages,
  userMessage,
  mode,
  recentMessageLimit = DISCUSSION_LIMITS.defaultRecentMessages
}: {
  space: DiscussionSpace;
  agent: AgentWithKey;
  members: MemberWithAgent[];
  messages: DiscussionMessage[];
  userMessage?: string;
  mode: "manual" | "round-robin" | "summary";
  recentMessageLimit?: number;
}): ChatMessage[] {
  const boundedLimit = Math.min(
    DISCUSSION_LIMITS.maxRecentMessages,
    Math.max(1, recentMessageLimit)
  );
  const recentMessages = messages.slice(-boundedLimit);
  const history = summarizeHistory(recentMessages);
  const memberList = members
    .filter((member) => member.enabled)
    .map(
      (member, index) =>
        `${index + 1}. ${member.agent.name} (${member.agent.provider}/${member.agent.model})：${member.agent.roleTitle ?? "通用讨论者"}`
    )
    .join("\n");
  const userTask =
    mode === "summary"
      ? "请生成结构化讨论总结。"
      : mode === "manual"
        ? `用户点名你回答：${userMessage ?? "请继续讨论。"}`
        : "现在轮到你发言。请基于前面讨论进行补充、质疑、推进或总结，避免重复。";

  return [
    {
      role: "user",
      content: `讨论空间信息：
- 标题：${space.title}
- 主题：${space.topic}
- 目标：${space.goal ?? "无特别目标"}
- 模式：${space.mode}

参与者：
${memberList || "暂无参与者"}

最近讨论历史（最多 ${boundedLimit} 条）：
${history}

当前任务：
${userTask}

当前发言 AI：${agent.name}（${agent.roleTitle ?? "通用讨论者"}）`
    }
  ];
}
