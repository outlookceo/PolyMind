# PolyMind 架构设计

PolyMind 的架构目标是：第一版足够简单，可以快速实现文本讨论空间；同时 Provider、调度器、流式输出和安全存储都有清晰边界，方便后续扩展。

## 系统架构

```text
Browser
  │
  │ React UI, forms, stream reader
  ▼
Next.js App Router
  │
  ├─ Server Components: 页面数据读取和布局
  ├─ Client Components: 表单、动画、流式展示、局部状态
  └─ Route Handlers: JSON API 和 Streaming API
        │
        ├─ Space Service
        ├─ Agent Service
        ├─ Discussion Scheduler
        ├─ Summary Service
        ├─ Provider Adapter Layer
        └─ Credential Service
              │
              ▼
          PostgreSQL + Prisma
```

关键边界：

- 页面组件不直接调用 AI Provider。
- Route Handler 不包含复杂调度逻辑。
- Provider Adapter 不直接操作数据库。
- API Key 解密只发生在服务端 Credential Service。
- 流式输出由 Discussion Service 协调，UI 只负责消费事件和渲染状态。

## 前端结构

建议目录：

```text
src/
  app/
    page.tsx
    spaces/
      page.tsx
      new/
        page.tsx
      [spaceId]/
        page.tsx
    settings/
      page.tsx
    api/

  components/
    ui/
    layout/
    motion/

  features/
    spaces/
      components/
      schemas/
      actions/
      queries/
    agents/
      components/
      schemas/
      services/
    discussions/
      components/
      hooks/
      scheduler/
      schemas/
    summaries/
      components/
      schemas/
    providers/
      components/
      schemas/

  lib/
    db.ts
    env.ts
    crypto.ts
    errors.ts
    ids.ts

  server/
    spaces/
    agents/
    discussions/
    providers/
    credentials/
```

前端职责：

- Server Components：读取空间、参与者、历史消息、总结。
- Client Components：创建和编辑表单、讨论启动控制、流式消息渲染、动画。
- Hooks：封装 stream 连接、乐观状态、暂停继续状态。
- UI 原语：按钮、输入框、卡片、Sheet、Dialog、Tabs、Tooltip、Badge。

空间详情页推荐组件：

```text
SpaceShell
  SpaceHeader
  AgentRail
    AgentCard
    AddAgentButton
  DiscussionTimeline
    RoundDivider
    MessageBubble
    StreamingMessage
  ContextPanel
    SpaceBrief
    SchedulerSettings
    SummaryPreview
```

## 后端结构

后端按业务服务拆分：

```text
server/
  spaces/
    space.service.ts
    space.repository.ts
  agents/
    agent.service.ts
    agent.repository.ts
  discussions/
    discussion.service.ts
    discussion.repository.ts
    discussion-scheduler.ts
    prompt-builder.ts
    stream-events.ts
  summaries/
    summary.service.ts
    summary-prompt.ts
  providers/
    provider-adapter.ts
    openai.adapter.ts
    openai-compatible.adapter.ts
    provider-errors.ts
  credentials/
    credential.service.ts
    encryption.ts
```

Route Handler 只做：

- 解析请求。
- 校验 schema。
- 调用 service。
- 转换响应。
- 处理错误。

不要在 Route Handler 内直接拼 prompt、查多张表或调用 Provider。

## 数据库结构

核心模型建议：

### Space

讨论空间，是聚合根。

字段：

- `id`
- `title`
- `goal`
- `context`
- `mode`
- `status`
- `maxRounds`
- `ownerId`，MVP 可为空，后续接账号系统。
- `createdAt`
- `updatedAt`

状态：

- `DRAFT`
- `READY`
- `RUNNING`
- `PAUSED`
- `COMPLETED`
- `FAILED`

### Agent

AI 参与者。

字段：

- `id`
- `spaceId`
- `name`
- `avatarKind`
- `color`
- `provider`
- `model`
- `credentialId`
- `baseUrl`
- `rolePrompt`
- `background`
- `speakingStyle`
- `taskFocus`
- `temperature`
- `maxOutputTokens`
- `sortOrder`
- `enabled`
- `createdAt`
- `updatedAt`

说明：

- `rolePrompt`、`background`、`speakingStyle`、`taskFocus` 均可为空。
- 为空时由 Prompt Builder 注入默认通用助手设定。
- `baseUrl` 可为空，为空时使用 Provider 默认值。

### ProviderCredential

Provider 密钥配置。

字段：

- `id`
- `ownerId`，MVP 可为空。
- `provider`
- `label`
- `encryptedApiKey`
- `baseUrl`
- `lastTestedAt`
- `lastTestStatus`
- `createdAt`
- `updatedAt`

要求：

- `encryptedApiKey` 必须加密存储。
- 前端只展示脱敏信息，例如 `sk-...abcd`。

### DiscussionRun

一次讨论运行。

字段：

- `id`
- `spaceId`
- `status`
- `currentRound`
- `maxRounds`
- `startedAt`
- `pausedAt`
- `completedAt`
- `errorCode`
- `errorMessage`
- `createdAt`
- `updatedAt`

状态：

- `QUEUED`
- `RUNNING`
- `PAUSED`
- `COMPLETED`
- `CANCELLED`
- `FAILED`

### Message

讨论消息。

字段：

- `id`
- `spaceId`
- `runId`
- `agentId`
- `role`
- `round`
- `status`
- `content`
- `tokenCount`
- `provider`
- `model`
- `parentMessageId`
- `startedAt`
- `completedAt`
- `createdAt`
- `updatedAt`

状态：

- `STREAMING`
- `COMPLETED`
- `FAILED`
- `CANCELLED`

`role` 可取：

- `SYSTEM`
- `AGENT`
- `USER`
- `SUMMARY`

### Summary

讨论总结。

字段：

- `id`
- `spaceId`
- `runId`
- `status`
- `headline`
- `consensus`
- `disagreements`
- `keyReasons`
- `risks`
- `actions`
- `openQuestions`
- `rawContent`
- `createdAt`
- `updatedAt`

## AI Provider Adapter 抽象设计

目标：让上层讨论调度器不关心 Provider 差异。

统一输入：

```ts
type GenerateInput = {
  model: string;
  messages: ProviderMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  signal?: AbortSignal;
};
```

统一输出：

```ts
type GenerateResult = {
  content: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
};
```

流式输出：

```ts
type StreamChunk =
  | { type: "delta"; text: string }
  | { type: "usage"; inputTokens?: number; outputTokens?: number }
  | { type: "done" };
```

Adapter 接口：

```ts
interface ProviderAdapter {
  id: string;
  generate(input: GenerateInput): Promise<GenerateResult>;
  stream(input: GenerateInput): AsyncIterable<StreamChunk>;
  testConnection(input: TestConnectionInput): Promise<TestConnectionResult>;
}
```

第一版 Adapter：

- `OpenAIAdapter`：使用官方 OpenAI 配置。
- `OpenAICompatibleAdapter`：使用用户提供的 `baseUrl`、`apiKey` 和模型名。

错误归一化：

- `PROVIDER_AUTH_FAILED`
- `PROVIDER_RATE_LIMITED`
- `PROVIDER_TIMEOUT`
- `PROVIDER_BAD_REQUEST`
- `PROVIDER_STREAM_INTERRUPTED`
- `PROVIDER_UNKNOWN_ERROR`

## 多 AI 讨论调度器设计

调度器是 PolyMind 的核心服务，负责让多个 AI 有秩序地围绕同一个主题讨论。

### 输入

- Space：主题、目标、背景、模式、轮次上限。
- Agents：参与者列表、角色配置、模型配置。
- History：已有消息。
- Run：当前运行状态。

### 输出

- 流式事件。
- 持久化消息。
- 更新后的运行状态。
- 可选的总结触发信号。

### 默认调度策略

第一版使用简单、可解释的 Round Robin：

1. 按 `sortOrder` 获取启用的 Agents。
2. 每一轮每个 Agent 最多发言一次。
3. 每个 Agent 发言前读取空间背景和最近消息。
4. 发言完成后写入数据库。
5. 达到 `maxRounds` 后结束。
6. 用户点击停止时立即取消后续发言。

### 后续可扩展策略

- Moderator：增加主持型 Agent 负责点名和收敛。
- Critique Loop：每轮固定加入批判者。
- Consensus First：检测共识程度，提前结束。
- User Directed：用户手动选择下一个发言者。
- Cost Aware：根据预算动态选择模型和轮次。

### Prompt Builder

每次 Agent 发言都由 Prompt Builder 生成上下文。

系统提示词结构：

```text
你是 PolyMind 讨论空间中的一个 AI 参与者。
讨论主题：...
讨论目标：...
背景上下文：...
你的名称：...
你的角色：...
你的背景：...
你的发言风格：...
你的任务定位：...

讨论规则：
1. 回应前面观点，而不是孤立输出。
2. 可以补充、质疑、澄清或提出替代方案。
3. 不要假装自己是人类参会者。
4. 内容要具体，可执行。
5. 如果信息不足，说明不确定性。
```

当用户未配置角色时：

```text
你的角色是通用 AI 助手。请以清晰、准确、建设性的方式参与讨论。
```

上下文裁剪策略：

- 总是包含空间主题和目标。
- 总是包含当前 Agent 设定。
- 优先包含最近 N 条消息。
- 当消息过长时压缩旧轮次。
- 后续可引入运行中摘要。

## 流式输出设计

第一版建议使用 Server-Sent Events 或 Web Streams。核心目标是让用户看到每个 Agent 的实时发言，同时保证数据库状态一致。

### 事件类型

```text
run.started
round.started
agent.started
message.delta
message.completed
agent.completed
round.completed
run.paused
run.cancelled
run.failed
run.completed
summary.delta
summary.completed
```

### 前端消费流程

1. 用户点击启动讨论。
2. 前端调用 `POST /api/spaces/:spaceId/discussions/start` 创建 run。
3. 前端连接 `GET /api/discussions/:runId/stream`。
4. 服务端依次发送事件。
5. 前端根据事件更新当前 Agent、轮次和消息内容。
6. 连接断开时前端重新读取 run 和 messages。

### 持久化策略

- Agent 开始发言时创建 `STREAMING` 消息。
- 每个 delta 可以先缓存在服务端内存，按节流周期写入数据库。
- 发言完成后写入完整 content，状态改为 `COMPLETED`。
- 失败时保存已有 partial content，状态改为 `FAILED`。
- 用户停止时状态改为 `CANCELLED`。

### 断线恢复

第一版不必实现复杂续传，但必须支持：

- 刷新页面后读取已保存消息。
- 如果 run 仍是 `RUNNING`，页面提示可重新连接。
- 如果消息卡在 `STREAMING` 超过阈值，服务端可标记为 `FAILED`。

## API Key 安全设计

安全边界：

- 浏览器不能直接调用任何 Provider。
- API Key 只进入服务端 Credential Service。
- 数据库中只保存加密后的密钥。
- 日志中只允许记录 Provider、模型、请求耗时和错误 code。

### 加密方案

第一版使用对称加密：

- `ENCRYPTION_KEY` 从环境变量读取。
- 加密算法建议使用 Node.js `crypto` 的 AES-256-GCM。
- 每条密钥使用独立随机 IV。
- 存储格式包含版本、IV、认证标签和密文。

示例格式：

```text
v1:base64(iv):base64(authTag):base64(ciphertext)
```

### 密钥展示

前端只展示：

```text
sk-...a1b2
```

不提供「查看完整密钥」功能。用户如需更换，只能重新输入。

### 密钥使用流程

```text
Route Handler
  ▼
Credential Service
  ▼
decrypt encryptedApiKey
  ▼
Provider Adapter
  ▼
AI Provider
```

### Provider 连通性测试

测试 API 只做最小请求：

- 验证 API Key 可用。
- 验证 Base URL 可达。
- 验证模型名基本可用。

测试结果保存：

- `lastTestedAt`
- `lastTestStatus`

不要保存测试 prompt 内容。

## 总结生成设计

总结可以由一个默认总结 Agent 完成，也可以让用户选择某个 Provider 和模型。

输入：

- 空间主题。
- 讨论目标。
- 背景上下文。
- 全部或压缩后的讨论消息。

输出结构：

```json
{
  "headline": "一句话结论",
  "consensus": ["共识 1", "共识 2"],
  "disagreements": ["分歧 1", "分歧 2"],
  "keyReasons": ["理由 1", "理由 2"],
  "risks": ["风险 1", "风险 2"],
  "actions": ["行动 1", "行动 2"],
  "openQuestions": ["问题 1", "问题 2"]
}
```

如果模型输出不是合法 JSON，Summary Service 应保留 `rawContent`，并尽量解析为结构化字段。前端应能展示原始总结，不能因为结构化解析失败而丢失结果。

## 扩展设计

后续扩展应遵守以下方向：

- 新 Provider 只新增 Adapter，不改调度器核心。
- 新讨论策略只新增 Scheduler Strategy，不改 UI 主流程。
- 新 Agent 模板只新增配置数据，不改 Agent 数据结构主字段。
- 新文件上下文通过 Context Source 模块接入，不直接塞进 Space 字段。
- 新协作功能通过 owner、member、permission 扩展，不影响单用户 MVP。

PolyMind 的长期架构重点不是把所有能力第一版做完，而是保证核心抽象清晰：空间、参与者、讨论运行、消息、总结、Provider、调度器。这些边界稳定，后续能力才不会把产品拖成复杂而脆弱的系统。
