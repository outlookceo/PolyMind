# PolyMind 工程协作规范

本文档约束后续 Codex 或其他开发助手在 PolyMind 项目中的开发行为。目标是保证项目长期可维护、UI 精致、架构清晰，并始终围绕「多 AI 智能体讨论空间」这个核心产品。

## 基本原则

- 不要把 PolyMind 做成会议室、聊天室换皮或普通单 AI 问答。
- 第一版只实现文本讨论，不引入语音、视频、团队协作、付费系统。
- 任何新增功能都必须服务于「创建空间、配置 AI、启动讨论、流式输出、生成总结」主路径。
- 优先使用项目既有模式和组件，不随意引入新框架。
- 保持改动范围清晰，不修改与当前任务无关的配置和文件。
- 不提交真实 API Key、数据库密码或本地私有配置。

## TypeScript 规范

- 必须开启并遵守严格类型检查。
- 禁止使用隐式 `any`，显式 `any` 只能用于不可避免的第三方边界，并添加原因说明。
- API 入参、表单数据和 Provider 返回数据必须使用 `zod` 或等价方式校验。
- 数据库实体类型优先使用 Prisma 生成类型，前端视图模型单独定义。
- 不在组件中直接拼接复杂业务对象，使用明确的 mapper 或 service。
- 异步函数必须明确处理错误路径，不吞掉异常。
- 对外暴露的函数、Adapter、Scheduler 类型要稳定，避免把具体 Provider 细节泄漏到上层。

推荐目录命名：

```text
src/
  app/
  components/
  features/
  lib/
  server/
  styles/
  types/
```

## UI 规范

- UI 气质应接近 Apple、Linear、Vercel、Stripe、Framer、Notion、Raycast 的精致、克制、现代和高完成度，但不能直接复制。
- 页面应像 AI 思维工作台或讨论空间，不要使用会议室座位、摄像头、麦克风、举手等视频会议隐喻。
- 所有核心页面必须有明确层次：空间信息、参与者、讨论流、上下文、总结。
- 禁止使用粗糙模板化大卡片堆叠、廉价渐变背景、随机插画和无意义装饰。
- 按钮、输入框、卡片、弹窗、Sheet、菜单等优先使用 shadcn/ui 作为基础。
- 图标优先使用 Lucide React，不手写常见功能图标。
- 动效使用 Framer Motion，原则是柔和、克制、表达状态变化，不做干扰阅读的炫技动画。
- 必须设计空状态、加载态、错误态、禁用态、流式输出态。
- 所有页面要在移动端、平板和桌面端都保持可读和可操作。

## 组件拆分规范

组件按功能域组织，不要把所有组件放在同一层级。

建议结构：

```text
src/features/spaces/
  components/
  actions/
  schemas/
  queries/

src/features/agents/
  components/
  schemas/
  services/

src/features/discussions/
  components/
  scheduler/
  services/

src/features/providers/
  adapters/
  schemas/
  services/
```

拆分原则：

- `app/` 目录负责路由、布局和页面组装。
- `features/` 负责业务域组件、schema、服务和查询。
- `components/ui/` 只放通用 UI 原语和 shadcn/ui 组件。
- Server Component 优先负责数据读取和页面结构。
- Client Component 只用于交互、动画、表单、流式状态和局部 UI 状态。
- 单个组件超过约 200 行时应检查是否需要拆分。
- 不为了抽象而抽象，只有当重复逻辑有稳定语义时才提取。

## API 设计规范

API 使用 Next.js Route Handlers。所有 API 必须：

- 只接受 JSON 或明确的 streaming 请求。
- 使用 schema 校验请求体、query 和 params。
- 返回统一错误结构。
- 不把原始异常、密钥、数据库连接信息返回给前端。
- 明确区分用户错误、Provider 错误、系统错误和限流错误。

建议错误格式：

```json
{
  "error": {
    "code": "PROVIDER_TIMEOUT",
    "message": "模型响应超时，请稍后重试。",
    "requestId": "req_xxx"
  }
}
```

建议 API：

```text
GET    /api/spaces
POST   /api/spaces
GET    /api/spaces/:spaceId
PATCH  /api/spaces/:spaceId
DELETE /api/spaces/:spaceId

POST   /api/spaces/:spaceId/agents
PATCH  /api/agents/:agentId
DELETE /api/agents/:agentId

POST   /api/spaces/:spaceId/discussions/start
POST   /api/discussions/:runId/pause
POST   /api/discussions/:runId/resume
POST   /api/discussions/:runId/stop
GET    /api/discussions/:runId/stream

POST   /api/spaces/:spaceId/summary
POST   /api/providers/test
```

## 数据库设计规范

- 使用 Prisma 管理 schema 和 migration。
- 表名和字段名保持清晰语义，不用缩写。
- 所有核心实体包含 `id`、`createdAt`、`updatedAt`。
- 软删除只在确有恢复需求时使用，MVP 可以先硬删除非关键草稿。
- Provider 配置和 API Key 分离存储，API Key 必须加密。
- 讨论消息必须保存状态，支持流式中断后的恢复和排查。

核心实体：

- `Space`：讨论空间。
- `Agent`：AI 参与者。
- `ProviderCredential`：Provider 密钥配置。
- `DiscussionRun`：一次讨论运行。
- `Message`：发言消息。
- `Summary`：讨论总结。

## AI Provider 规范

Provider Adapter 必须屏蔽底层差异，上层只依赖统一接口。

Adapter 必须支持：

- 普通生成。
- 流式生成。
- 模型参数。
- 错误归一化。
- 取消或超时。

Adapter 不应知道页面结构，也不应直接操作数据库。调度器负责组织上下文，service 负责持久化，Adapter 只负责模型调用。

## 多 AI 调度规范

调度器是 PolyMind 的核心，不得散落在页面组件或 API Handler 中。

调度器职责：

- 根据空间配置选择发言者。
- 构造每个 Agent 的系统提示词和上下文。
- 控制轮次、最大消息数和停止条件。
- 将发言过程写入消息状态。
- 在暂停、继续、停止时保持状态一致。

讨论默认协议：

- 每个 AI 必须知道讨论主题、目标、背景。
- 每个 AI 必须知道自己的角色和任务定位。
- 每个 AI 应引用或回应前面观点，而不是孤立输出。
- 每轮应鼓励补充、质疑、澄清或收敛。
- 最后总结应区分共识和分歧。

## 安全要求

- 所有 API Key 只在服务端读取和使用。
- 前端永不接收完整 API Key。
- 数据库存储 API Key 前必须使用 `ENCRYPTION_KEY` 加密。
- 日志中不得打印 prompt 中的敏感信息、完整 API Key 或 Provider 原始鉴权头。
- Provider 请求必须设置超时。
- 用户输入必须做长度限制，避免超长上下文导致成本失控。
- 所有写操作必须校验权限边界。MVP 如果暂不做账号系统，也要在服务层保留 owner 字段扩展点。
- 生产环境必须使用 HTTPS、强随机密钥和安全数据库连接。

## 测试要求

最低要求：

- Provider Adapter 单元测试。
- 调度器单元测试。
- API schema 校验测试。
- Space、Agent、Discussion 的关键 service 测试。
- UI 关键流程的端到端测试。

建议测试场景：

- 创建空间并添加多个 AI。
- 未配置角色时使用默认助手设定。
- OpenAI-compatible Base URL 配置错误时返回友好错误。
- 流式输出中断后消息状态为 `FAILED` 或 `CANCELLED`。
- 暂停讨论后不继续触发后续 Agent。
- 总结生成包含共识、分歧和行动建议。

每次重要改动后至少运行：

```bash
npm run lint
npm run typecheck
npm test
```

如果某项无法运行，必须在交付说明中说明原因。
