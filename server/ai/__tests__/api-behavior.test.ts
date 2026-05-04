import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

loadLocalEnv();

const { db } = await import("@/lib/db");
const { POST: createAgent } = await import("@/app/api/agents/route");
const { POST: createSpace } = await import("@/app/api/spaces/route");
const { POST: createMessage } = await import("@/app/api/spaces/[id]/messages/route");

const testPrefix = `Vitest PolyMind ${Date.now()}`;
let databaseAvailable = false;

beforeAll(async () => {
  try {
    await db.$queryRaw`SELECT 1`;
    databaseAvailable = true;
    await cleanup();
  } catch {
    databaseAvailable = false;
  }
});

afterAll(async () => {
  if (databaseAvailable) {
    await cleanup();
  }
  await db.$disconnect();
});

describe("basic API behavior", () => {
  it("creates an agent, creates a space, and saves a message", async () => {
    if (!databaseAvailable) {
      expect(databaseAvailable).toBe(false);
      return;
    }

    const agentResponse = await createAgent(
      jsonRequest("/api/agents", {
        name: `${testPrefix} Agent`,
        provider: "openai-compatible",
        model: "mock-model",
        providerKeyId: null,
        roleTitle: "测试讨论者",
        backgroundInfo: null,
        persona: null,
        speakingStyle: null,
        systemPrompt: null,
        temperature: 0.5,
        maxTokens: 800,
        isDefault: false
      })
    );
    const agentPayload = (await agentResponse.json()) as { data: { id: string; name: string } };

    expect(agentResponse.status).toBe(201);
    expect(agentPayload.data.name).toBe(`${testPrefix} Agent`);

    const spaceResponse = await createSpace(
      jsonRequest("/api/spaces", {
        title: `${testPrefix} Space`,
        topic: "验证 API 可以保存真实讨论空间。",
        goal: "完成创建 space 与加入 AI 的基本流程。",
        mode: "轮流发言",
        maxRounds: 3,
        autoSummary: true,
        agentIds: [agentPayload.data.id]
      })
    );
    const spacePayload = (await spaceResponse.json()) as {
      data: { id: string; title: string; members: Array<{ agentId: string }> };
    };

    expect(spaceResponse.status).toBe(201);
    expect(spacePayload.data.title).toBe(`${testPrefix} Space`);
    expect(spacePayload.data.members[0]?.agentId).toBe(agentPayload.data.id);

    const messageResponse = await createMessage(
      jsonRequest(`/api/spaces/${spacePayload.data.id}/messages`, {
        senderType: "USER",
        content: "这是一条用于验证保存的用户消息。",
        roundIndex: 0
      }),
      { params: Promise.resolve({ id: spacePayload.data.id }) }
    );
    const messagePayload = (await messageResponse.json()) as {
      data: { id: string; content: string; senderType: string };
    };

    expect(messageResponse.status).toBe(201);
    expect(messagePayload.data.senderType).toBe("USER");
    expect(messagePayload.data.content).toContain("验证保存");
  });
});

function jsonRequest(url: string, body: unknown) {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function cleanup() {
  await db.discussionSpace.deleteMany({
    where: { title: { startsWith: testPrefix } }
  });
  await db.aiAgent.deleteMany({
    where: { name: { startsWith: testPrefix } }
  });
}

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    process.env[key] ??= value;
  }
}
