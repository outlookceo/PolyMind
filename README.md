# PolyMind

PolyMind 是一个「多 AI 智能体讨论空间」。它不是传统会议室，也不是单一聊天机器人，而是让用户创建一个主题空间，加入多个不同 Provider、不同模型、不同角色定位的 AI，让它们围绕同一个问题进行补充、质疑、辩论、推进和总结。

第一版聚焦文本讨论：配置 AI 参与者、创建讨论空间、保存历史消息、流式输出、多 AI 轮流发言、手动点名发言和结构化总结。

## 核心功能

- 创建讨论空间：保存主题、目标、讨论模式、最大轮数和自动总结设置。
- 配置 AI 参与者：支持 Provider、模型、Provider Key、角色、背景信息、人设、发言风格、system prompt、temperature、max tokens。
- 默认通用讨论者：角色字段全部可选，不填写时使用默认协作型讨论 prompt。
- Provider Key 安全保存：用户 API Key 使用 AES-256-GCM 加密入库，前端只展示脱敏结果。
- 多 Provider 适配：已接入 OpenAI、Kimi、MiniMax、DeepSeek，并保留通用 OpenAI-compatible Adapter。
- 真实流式讨论：支持手动点名、轮流发言、总结生成，AI 回复完成后保存到数据库。
- 核心 UI 原型：深色优先、玻璃拟态、消息流、Markdown/代码块展示、loading/empty/error 状态。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui 风格组件
- Framer Motion
- Lucide React
- Prisma
- PostgreSQL
- Next.js Route Handlers
- Server-Sent Events / Web Streams
- Vitest

## 本地启动

安装依赖：

```bash
npm install
```

准备环境变量：

```bash
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

把生成的 32 字节 base64 字符串填入 `.env` 的 `ENCRYPTION_KEY`。

启动本地 PostgreSQL：

```bash
docker compose up -d
```

初始化数据库：

```bash
npx prisma migrate dev
npx prisma generate
```

启动开发服务器：

```bash
npm run dev
```

默认访问：

```text
http://localhost:3000
```

## 环境变量

```env
DATABASE_URL="postgresql://polymind:polymind_dev_password@localhost:5432/polymind?schema=public"
ENCRYPTION_KEY=""
DEMO_USER_EMAIL="demo@polymind.local"
DEMO_USER_NAME="PolyMind Demo User"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

- `DATABASE_URL`：PostgreSQL 连接字符串，供 Prisma 使用。
- `ENCRYPTION_KEY`：AES-256-GCM 加密密钥，必须解码为 32 字节。真实部署前必须设置。
- `DEMO_USER_EMAIL` / `DEMO_USER_NAME`：开发阶段临时用户。后续接入 Auth 时替换 `lib/server/auth.ts`。
- `NEXT_PUBLIC_APP_URL`：应用公开访问地址。

用户填写的 OpenAI、Kimi、MiniMax、DeepSeek 或 OpenAI-compatible API Key 会通过 `/settings/api-keys` 写入数据库，不需要放进环境变量。

## 常用命令

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Prisma：

```bash
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

## 部署说明

部署前需要准备：

- 一个可访问的 PostgreSQL 数据库，并设置生产 `DATABASE_URL`。
- 一个生产级 `ENCRYPTION_KEY`，部署后不要随意更换，否则旧的 Provider Key 将无法解密。
- 执行 `npx prisma migrate deploy` 应用迁移。
- 执行 `npm run build` 检查 Next.js 构建。
- 确认日志、错误上报和 API 响应中不会输出明文 Provider API Key。

推荐部署流程：

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

## 第一版边界

第一版只做文本多 AI 讨论，不做语音、视频、团队协作、组织管理、付费系统和公开模板市场。当前架构已经为 Anthropic、Gemini、Qwen、本地模型、硅基流动、火山方舟等 Provider 扩展预留 Adapter 位置。
