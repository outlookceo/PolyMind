import { db } from "@/lib/db";
import { decryptApiKey } from "@/lib/server/crypto";
import { buildAgentSystemPrompt } from "@/server/ai/context/build-agent-system-prompt";
import { buildDiscussionContext } from "@/server/ai/context/build-discussion-context";
import { getProviderAdapter } from "@/server/ai/providers";
import { DISCUSSION_LIMITS } from "@/server/ai/safety/limits";
import {
  getOwnedSpaceWithMembers,
  serializeMessage,
  type DiscussionStreamEvent
} from "@/server/ai/orchestrator/ask-agent";

export async function* generateSummary({
  userId,
  spaceId,
  summaryAgentId
}: {
  userId: string;
  spaceId: string;
  summaryAgentId?: string;
}): AsyncIterable<DiscussionStreamEvent> {
  const space = await getOwnedSpaceWithMembers(userId, spaceId);
  const member =
    space.members.find((item) => item.enabled && item.agentId === summaryAgentId) ??
    space.members.find((item) => item.enabled);

  if (!member) {
    yield {
      type: "error",
      error: { message: "没有可用 AI 参与者生成总结。", retryable: false }
    };
    return;
  }

  const agent = member.agent;
  if (!agent.providerKey) {
    yield {
      type: "error",
      agentId: agent.id,
      error: { message: "总结 AI 尚未绑定 Provider API Key。", retryable: false }
    };
    return;
  }

  const recentHistory = await db.discussionMessage.findMany({
    where: { spaceId },
    orderBy: { createdAt: "desc" },
    take: DISCUSSION_LIMITS.maxSummaryMessages
  });
  const history = recentHistory.reverse();
  const adapter = getProviderAdapter(agent.provider);
  const systemPrompt = buildAgentSystemPrompt({
    space,
    agent,
    members: space.members,
    task: "summary"
  });
  const messages = buildDiscussionContext({
    space,
    agent,
    members: space.members,
    messages: history,
    mode: "summary",
    recentMessageLimit: DISCUSSION_LIMITS.maxSummaryMessages
  });
  const apiKey = decryptApiKey(agent.providerKey);
  let summary = "";

  yield {
    type: "agent.started",
    agent: {
      id: agent.id,
      name: agent.name,
      provider: agent.provider,
      model: agent.model,
      roleTitle: agent.roleTitle
    }
  };

  for await (const chunk of adapter.streamChat({
    provider: agent.provider,
    model: agent.model,
    apiKey,
    baseUrl: agent.providerKey.baseUrl ?? adapter.defaultBaseUrl,
    systemPrompt,
    messages: [
      ...messages,
      {
        role: "user",
        content:
          "请输出结构化总结，包含：讨论主题、核心结论、各 AI 主要观点、分歧点、最终建议、行动清单、后续问题。"
      }
    ],
    temperature: Math.min(agent.temperature, 0.6),
    maxTokens: agent.maxTokens
  })) {
    if (chunk.type === "error") {
      yield {
        type: "error",
        agentId: agent.id,
        error: chunk.error ?? { message: "总结失败。", retryable: true }
      };
      return;
    }
    if (chunk.type === "done") break;
    summary += chunk.content ?? "";
    yield {
      type: "delta",
      agentId: agent.id,
      content: chunk.content,
      reasoningContent: chunk.reasoningContent
    };
  }

  const trimmedSummary = summary.trim();
  const actionItems = extractActionItems(trimmedSummary);
  const currentRound = history.reduce((max, message) => Math.max(max, message.roundIndex), 0);
  const saved = await db.discussionMessage.create({
    data: {
      spaceId,
      senderType: "SUMMARY",
      senderAgentId: agent.id,
      content: trimmedSummary,
      roundIndex: 0,
      metadataJson: { provider: agent.provider, model: agent.model }
    }
  });
  await db.discussionRun.create({
    data: {
      spaceId,
      status: "COMPLETED",
      currentRound,
      summary: trimmedSummary,
      actionItemsJson: actionItems
    }
  });

  yield {
    type: "agent.completed",
    agentId: agent.id,
    message: serializeMessage(saved)
  };
  yield {
    type: "summary.completed",
    summary: trimmedSummary,
    actionItems
  };
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
    .slice(0, 12);
}
