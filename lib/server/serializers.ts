import type {
  AiAgent,
  DiscussionMessage,
  DiscussionSpace,
  ProviderKey,
  SpaceMember
} from "@prisma/client";

import { decryptApiKey, maskApiKey } from "@/lib/server/crypto";
import type { AgentTone } from "@/lib/agent-tone";

const tones: AgentTone[] = ["blue", "amber", "green", "cyan", "rose", "slate"];

function toneFromId(id: string): AgentTone {
  const sum = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return tones[sum % tones.length];
}

function initialFromName(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "A";
}

export function serializeProviderKey(key: ProviderKey) {
  const decrypted = decryptApiKey({
    encryptedApiKey: key.encryptedApiKey,
    iv: key.iv,
    authTag: key.authTag
  });

  return {
    id: key.id,
    provider: key.provider,
    keyName: key.keyName,
    maskedKey: maskApiKey(decrypted),
    baseUrl: key.baseUrl,
    createdAt: key.createdAt.toISOString(),
    updatedAt: key.updatedAt.toISOString(),
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null
  };
}

export function serializeAgent(
  agent: AiAgent & { providerKey?: Pick<ProviderKey, "keyName"> | null }
) {
  return {
    id: agent.id,
    name: agent.name,
    avatarUrl: agent.avatarUrl,
    avatar: initialFromName(agent.name),
    color: toneFromId(agent.id),
    provider: agent.provider,
    model: agent.model,
    providerKeyId: agent.providerKeyId,
    providerKeyName: agent.providerKey?.keyName ?? null,
    roleTitle: agent.roleTitle,
    backgroundInfo: agent.backgroundInfo,
    persona: agent.persona,
    speakingStyle: agent.speakingStyle,
    systemPrompt: agent.systemPrompt,
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
    isDefault: agent.isDefault,
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString()
  };
}

export function serializeMember(
  member: SpaceMember & {
    agent: AiAgent & { providerKey?: Pick<ProviderKey, "keyName"> | null };
  }
) {
  return {
    id: member.id,
    agentId: member.agentId,
    seatOrder: member.seatOrder,
    enabled: member.enabled,
    createdAt: member.createdAt.toISOString(),
    agent: serializeAgent(member.agent)
  };
}

export function serializeSpace(
  space: DiscussionSpace & {
    members?: Array<
      SpaceMember & {
        agent: AiAgent & { providerKey?: Pick<ProviderKey, "keyName"> | null };
      }
    >;
    runs?: Array<{ summary: string | null; currentRound: number; status: string }>;
  }
) {
  const latestRun = space.runs?.[0];
  const summary =
    latestRun?.summary ??
    (space.status === "DRAFT"
      ? "还未生成总结。创建消息或运行讨论后，这里会显示结构化结论。"
      : "讨论正在准备总结。");
  const progress =
    latestRun && space.maxRounds > 0
      ? Math.min(100, Math.round((latestRun.currentRound / space.maxRounds) * 100))
      : space.status === "COMPLETED"
        ? 100
        : space.status === "DRAFT"
          ? 8
          : 36;

  return {
    id: space.id,
    title: space.title,
    topic: space.topic,
    goal: space.goal,
    mode: space.mode,
    maxRounds: space.maxRounds,
    autoSummary: space.autoSummary,
    status: space.status,
    createdAt: space.createdAt.toISOString(),
    updatedAt: space.updatedAt.toISOString(),
    memberCount: space.members?.length ?? 0,
    members: space.members?.map(serializeMember) ?? [],
    summary,
    progress,
    tags: [space.mode, space.status]
  };
}

export function serializeMessage(message: DiscussionMessage) {
  return {
    id: message.id,
    spaceId: message.spaceId,
    senderType: message.senderType as "USER" | "AGENT" | "SYSTEM" | "SUMMARY",
    senderAgentId: message.senderAgentId,
    content: message.content,
    roundIndex: message.roundIndex,
    metadataJson: message.metadataJson,
    createdAt: message.createdAt.toISOString()
  };
}
