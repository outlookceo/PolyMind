import type { AiAgent, DiscussionSpace, ProviderKey, SpaceMember } from "@prisma/client";

import { db } from "@/lib/db";
import { decryptApiKey } from "@/lib/server/crypto";
import { buildAgentSystemPrompt } from "@/server/ai/context/build-agent-system-prompt";
import { buildDiscussionContext } from "@/server/ai/context/build-discussion-context";
import { getProviderAdapter } from "@/server/ai/providers";
import type { ProviderError, TokenUsage } from "@/server/ai/providers/types";
import { DISCUSSION_LIMITS, assertUserMessageWithinLimit } from "@/server/ai/safety/limits";

type AgentWithKey = AiAgent & { providerKey: ProviderKey | null };
type MemberWithAgent = SpaceMember & { agent: AiAgent & { providerKey: ProviderKey | null } };

export type DiscussionStreamEvent =
  | { type: "user.message"; message: SerializedMessage }
  | { type: "agent.started"; agent: SerializedAgent }
  | { type: "delta"; agentId: string; content?: string; reasoningContent?: string; usage?: TokenUsage }
  | { type: "agent.completed"; agentId: string; message: SerializedMessage; usage?: TokenUsage }
  | { type: "summary.completed"; summary: string; actionItems: string[] }
  | { type: "error"; agentId?: string; error: ProviderError | { message: string; retryable: boolean } };

export type SerializedMessage = {
  id: string;
  spaceId: string;
  senderType: string;
  senderAgentId: string | null;
  content: string;
  roundIndex: number;
  metadataJson: unknown;
  createdAt: string;
};

export type SerializedAgent = {
  id: string;
  name: string;
  provider: string;
  model: string;
  roleTitle: string | null;
};

export async function* askAgent({
  userId,
  spaceId,
  agentId,
  userMessage,
  roundIndex,
  saveUserMessage = true
}: {
  userId: string;
  spaceId: string;
  agentId: string;
  userMessage?: string;
  roundIndex?: number;
  saveUserMessage?: boolean;
}): AsyncIterable<DiscussionStreamEvent> {
  if (userMessage) {
    assertUserMessageWithinLimit(userMessage);
  }

  const space = await getOwnedSpaceWithMembers(userId, spaceId);
  const member = space.members.find((item) => item.agentId === agentId && item.enabled);

  if (!member) {
    yield {
      type: "error",
      agentId,
      error: { message: "该 AI 不属于当前讨论空间或已被禁用。", retryable: false }
    };
    return;
  }

  const agent = member.agent as AgentWithKey;
  if (!agent.providerKey) {
    yield {
      type: "error",
      agentId,
      error: { message: "该 AI 尚未绑定 Provider API Key。", retryable: false }
    };
    return;
  }

  const computedRoundIndex = roundIndex ?? (await getNextRoundIndex(spaceId));

  if (userMessage && saveUserMessage) {
    const savedUserMessage = await db.discussionMessage.create({
      data: {
        spaceId,
        senderType: "USER",
        content: userMessage,
        roundIndex: computedRoundIndex
      }
    });
    yield { type: "user.message", message: serializeMessage(savedUserMessage) };
  }

  const recentHistory = await db.discussionMessage.findMany({
    where: { spaceId },
    orderBy: { createdAt: "desc" },
    take: DISCUSSION_LIMITS.maxRecentMessages
  });
  const history = recentHistory.reverse();
  const systemPrompt = buildAgentSystemPrompt({
    space,
    agent,
    members: space.members,
    task: userMessage ? "manual" : "round-robin"
  });
  const messages = buildDiscussionContext({
    space,
    agent,
    members: space.members,
    messages: history,
    userMessage,
    mode: userMessage ? "manual" : "round-robin"
  });
  const adapter = getProviderAdapter(agent.provider);
  const apiKey = decryptApiKey(agent.providerKey);
  const baseUrl = agent.providerKey.baseUrl ?? adapter.defaultBaseUrl;
  let content = "";
  let reasoningContent = "";
  let usage: TokenUsage | undefined;
  const startedAt = Date.now();

  yield { type: "agent.started", agent: serializeAgent(agent) };

  for await (const chunk of adapter.streamChat({
    provider: agent.provider,
    model: agent.model,
    apiKey,
    baseUrl,
    systemPrompt,
    messages,
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
    streamOptions: { include_usage: true }
  })) {
    if (chunk.type === "error") {
      yield {
        type: "error",
        agentId: agent.id,
        error: chunk.error ?? { message: "Provider 调用失败。", retryable: true }
      };
      return;
    }

    if (chunk.type === "done") break;

    content += chunk.content ?? "";
    reasoningContent += chunk.reasoningContent ?? "";
    usage = chunk.usage ?? usage;
    yield {
      type: "delta",
      agentId: agent.id,
      content: chunk.content,
      reasoningContent: chunk.reasoningContent,
      usage: chunk.usage
    };
  }

  const savedMessage = await db.discussionMessage.create({
    data: {
      spaceId,
      senderType: "AGENT",
      senderAgentId: agent.id,
      content: content.trim(),
      roundIndex: computedRoundIndex,
      metadataJson: {
        provider: agent.provider,
        model: agent.model,
        reasoningContent: reasoningContent || undefined,
        usage
      }
    }
  });

  await db.providerKey.update({
    where: { id: agent.providerKey.id },
    data: { lastUsedAt: new Date() }
  });

  await db.usageLog.create({
    data: {
      userId,
      spaceId,
      agentId: agent.id,
      provider: agent.provider,
      model: agent.model,
      promptTokens: usage?.promptTokens ?? 0,
      completionTokens: usage?.completionTokens ?? 0,
      totalTokens: usage?.totalTokens ?? 0,
      latencyMs: Date.now() - startedAt
    }
  });

  yield {
    type: "agent.completed",
    agentId: agent.id,
    message: serializeMessage(savedMessage),
    usage
  };
}

export async function getOwnedSpaceWithMembers(userId: string, spaceId: string) {
  const space = await db.discussionSpace.findFirst({
    where: { id: spaceId, userId },
    include: {
      members: {
        include: { agent: { include: { providerKey: true } } },
        orderBy: { seatOrder: "asc" }
      }
    }
  });

  if (!space) {
    throw new Error("讨论空间不存在或无权访问。");
  }

  return space as DiscussionSpace & { members: MemberWithAgent[] };
}

export async function getNextRoundIndex(spaceId: string) {
  const latest = await db.discussionMessage.findFirst({
    where: { spaceId },
    orderBy: [{ roundIndex: "desc" }, { createdAt: "desc" }],
    select: { roundIndex: true }
  });

  return latest ? latest.roundIndex + 1 : 0;
}

export function serializeMessage(message: {
  id: string;
  spaceId: string;
  senderType: string;
  senderAgentId: string | null;
  content: string;
  roundIndex: number;
  metadataJson: unknown;
  createdAt: Date;
}): SerializedMessage {
  return {
    id: message.id,
    spaceId: message.spaceId,
    senderType: message.senderType,
    senderAgentId: message.senderAgentId,
    content: message.content,
    roundIndex: message.roundIndex,
    metadataJson: message.metadataJson,
    createdAt: message.createdAt.toISOString()
  };
}

function serializeAgent(agent: AiAgent): SerializedAgent {
  return {
    id: agent.id,
    name: agent.name,
    provider: agent.provider,
    model: agent.model,
    roleTitle: agent.roleTitle
  };
}
