import type { AgentTone } from "@/lib/agent-tone";

export type ProviderKeyRecord = {
  id: string;
  provider: string;
  keyName: string;
  maskedKey: string;
  baseUrl: string | null;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
};

export type AgentRecord = {
  id: string;
  name: string;
  avatarUrl: string | null;
  avatar: string;
  color: AgentTone;
  provider: string;
  model: string;
  providerKeyId: string | null;
  providerKeyName: string | null;
  roleTitle: string | null;
  backgroundInfo: string | null;
  persona: string | null;
  speakingStyle: string | null;
  systemPrompt: string | null;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SpaceMemberRecord = {
  id: string;
  agentId: string;
  seatOrder: number;
  enabled: boolean;
  createdAt: string;
  agent: AgentRecord;
};

export type SpaceRecord = {
  id: string;
  title: string;
  topic: string;
  goal: string | null;
  mode: string;
  maxRounds: number;
  autoSummary: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  members: SpaceMemberRecord[];
  summary: string;
  progress: number;
  tags: string[];
};

export type MessageRecord = {
  id: string;
  spaceId: string;
  senderType: "USER" | "AGENT" | "SYSTEM" | "SUMMARY";
  senderAgentId: string | null;
  content: string;
  roundIndex: number;
  metadataJson: unknown;
  createdAt: string;
};
