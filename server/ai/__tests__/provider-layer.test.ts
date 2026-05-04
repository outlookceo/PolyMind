import type { AiAgent, DiscussionMessage, DiscussionSpace, ProviderKey, SpaceMember } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { decryptApiKey, encryptApiKey } from "@/lib/server/crypto";
import { serializeProviderKey } from "@/lib/server/serializers";
import { buildAgentSystemPrompt } from "@/server/ai/context/build-agent-system-prompt";
import { buildDiscussionContext } from "@/server/ai/context/build-discussion-context";
import { PROVIDER_BASE_URL_HINTS } from "@/server/ai/models/provider-models";
import { getProviderAdapter } from "@/server/ai/providers";
import { OpenAICompatibleAdapter } from "@/server/ai/providers/openai-compatible";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("provider adapter registry", () => {
  it("returns the expected provider adapters", () => {
    expect(getProviderAdapter("openai").id).toBe("openai");
    expect(getProviderAdapter("kimi").id).toBe("kimi");
    expect(getProviderAdapter("minimax").id).toBe("minimax");
    expect(getProviderAdapter("deepseek").id).toBe("deepseek");
    expect(getProviderAdapter("openai-compatible").id).toBe("openai-compatible");
  });

  it("uses default base URLs for compatible provider wrappers", () => {
    expect(getProviderAdapter("kimi").defaultBaseUrl).toBe(PROVIDER_BASE_URL_HINTS.kimi);
    expect(getProviderAdapter("minimax").defaultBaseUrl).toBe(PROVIDER_BASE_URL_HINTS.minimax);
    expect(getProviderAdapter("deepseek").defaultBaseUrl).toBe(PROVIDER_BASE_URL_HINTS.deepseek);
  });

  it("lets OpenAI-compatible calls use a custom baseUrl", async () => {
    let calledUrl = "";
    global.fetch = vi.fn(async (url: string | URL | Request) => {
      calledUrl = String(url);
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "ok" } }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const adapter = new OpenAICompatibleAdapter();
    await adapter.chat({
      provider: "openai-compatible",
      model: "custom-model",
      apiKey: "sk-test",
      baseUrl: "https://models.example.com/v1",
      systemPrompt: "test",
      messages: [{ role: "user", content: "hello" }]
    });

    expect(calledUrl).toBe("https://models.example.com/v1/chat/completions");
  });
});

describe("discussion context builders", () => {
  const space = {
    id: "space_1",
    userId: "user_1",
    title: "Architecture Space",
    topic: "如何设计多 AI 讨论调度器？",
    goal: "形成可执行架构",
    mode: "轮流发言",
    maxRounds: 4,
    autoSummary: true,
    status: "READY",
    createdAt: new Date(),
    updatedAt: new Date()
  } as DiscussionSpace;

  const agent = {
    id: "agent_1",
    userId: "user_1",
    name: "Orion",
    avatarUrl: null,
    provider: "deepseek",
    model: "deepseek-chat",
    providerKeyId: "key_1",
    roleTitle: "技术架构师",
    backgroundInfo: "熟悉 Next.js 和流式输出",
    persona: "审慎、工程化",
    speakingStyle: "结构化",
    systemPrompt: null,
    temperature: 0.5,
    maxTokens: 1200,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
  } as AiAgent;

  const defaultAgent = {
    ...agent,
    id: "agent_2",
    name: "Atlas",
    roleTitle: null,
    backgroundInfo: null,
    persona: null,
    speakingStyle: null,
    systemPrompt: null
  } as AiAgent;

  const members = [
    {
      id: "member_1",
      spaceId: space.id,
      agentId: agent.id,
      seatOrder: 0,
      enabled: true,
      createdAt: new Date(),
      agent
    }
  ] as Array<SpaceMember & { agent: AiAgent }>;

  it("builds a role-aware system prompt", () => {
    const prompt = buildAgentSystemPrompt({ space, agent, members, task: "round-robin" });

    expect(prompt).toContain("技术架构师");
    expect(prompt).toContain("审慎、工程化");
    expect(prompt).toContain("不要重复其他 AI 已经说过的内容");
  });

  it("builds a default prompt when role fields are empty", () => {
    const prompt = buildAgentSystemPrompt({
      space,
      agent: defaultAgent,
      members,
      task: "manual"
    });

    expect(prompt).toContain("通用讨论者");
    expect(prompt).toContain("理性、清晰、协作");
  });

  it("limits discussion history instead of stuffing every message", () => {
    const messages = Array.from({ length: 30 }, (_, index) => ({
      id: `message_${index}`,
      spaceId: space.id,
      senderType: "USER",
      senderAgentId: null,
      content: `message ${index}`,
      roundIndex: index,
      metadataJson: null,
      createdAt: new Date()
    })) as DiscussionMessage[];
    const context = buildDiscussionContext({
      space,
      agent,
      members,
      messages,
      mode: "round-robin",
      recentMessageLimit: 12
    });

    expect(context[0].content).not.toContain("message 0");
    expect(context[0].content).toContain("message 29");
  });
});

describe("provider key serialization", () => {
  it("encrypts and decrypts API keys with AES-256-GCM fields", () => {
    process.env.ENCRYPTION_KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    const encrypted = encryptApiKey("sk-test-secret");

    expect(encrypted.encryptedApiKey).not.toContain("sk-test-secret");
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.authTag).toBeTruthy();
    expect(decryptApiKey(encrypted)).toBe("sk-test-secret");
  });

  it("does not expose plaintext API keys in frontend responses", () => {
    process.env.ENCRYPTION_KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    const plaintext = "sk-test-secret-1234abcd";
    const encrypted = encryptApiKey(plaintext);
    const providerKey = {
      id: "key_1",
      userId: "user_1",
      provider: "openai",
      keyName: "Test Key",
      baseUrl: "https://api.openai.com/v1",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUsedAt: null,
      ...encrypted
    } as ProviderKey;

    const serialized = serializeProviderKey(providerKey);
    const responseJson = JSON.stringify(serialized);

    expect(serialized.maskedKey).toBe("sk-****abcd");
    expect(responseJson).not.toContain(plaintext);
    expect(responseJson).not.toContain(providerKey.encryptedApiKey);
  });
});
