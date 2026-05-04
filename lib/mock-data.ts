import type { LucideIcon } from "lucide-react";
import {
  BrainCircuit,
  Code2,
  Compass,
  FileText,
  FlaskConical,
  Lightbulb,
  LineChart,
  PenLine,
  ShieldCheck,
  Sparkles,
  Wand2
} from "lucide-react";

import type { AgentTone } from "@/lib/agent-tone";

export type { AgentTone };

export type Agent = {
  id: string;
  name: string;
  role: string;
  provider: string;
  model: string;
  avatar: string;
  color: AgentTone;
  accent: string;
  persona: string;
  style: string;
  temperature: number;
  maxTokens: number;
};

export type SpaceStatus = "Running" | "Paused" | "Draft" | "Completed";

export type Space = {
  id: string;
  name: string;
  topic: string;
  goal: string;
  mode: string;
  status: SpaceStatus;
  updatedAt: string;
  agentIds: string[];
  tags: string[];
  summary: string;
  progress: number;
  maxRounds: number;
};

export type DiscussionMessage = {
  id: string;
  role: "user" | "agent";
  agentId?: string;
  round: number;
  content: string;
  status: "completed" | "streaming";
  createdAt: string;
  replyTo?: string;
};

export type ProviderKey = {
  id: string;
  provider: string;
  label: string;
  baseUrl: string;
  maskedKey: string;
  status: "Connected" | "Needs test" | "Rate limited";
  lastTestedAt: string;
};

export type Scenario = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const agents: Agent[] = [
  {
    id: "agent-strategist",
    name: "Nova",
    role: "产品策略师",
    provider: "OpenAI",
    model: "gpt-4.1",
    avatar: "N",
    color: "blue",
    accent: "from-blue-400 to-cyan-300",
    persona: "擅长把模糊机会拆成用户价值、商业路径和阶段性验证。",
    style: "结构化、短句、先结论后依据",
    temperature: 0.7,
    maxTokens: 1400
  },
  {
    id: "agent-critic",
    name: "Sable",
    role: "风险质疑者",
    provider: "OpenAI Compatible",
    model: "deepseek-chat",
    avatar: "S",
    color: "amber",
    accent: "from-amber-300 to-orange-400",
    persona: "专门指出隐含假设、边界条件、成本和潜在失败模式。",
    style: "直接、审慎、带反例",
    temperature: 0.42,
    maxTokens: 1200
  },
  {
    id: "agent-builder",
    name: "Orion",
    role: "系统架构师",
    provider: "OpenAI",
    model: "gpt-4.1-mini",
    avatar: "O",
    color: "green",
    accent: "from-emerald-300 to-lime-300",
    persona: "把讨论落成模块、接口、数据结构和迭代顺序。",
    style: "工程化、可执行、强调取舍",
    temperature: 0.5,
    maxTokens: 1600
  },
  {
    id: "agent-researcher",
    name: "Mira",
    role: "研究分析员",
    provider: "Gemini Ready",
    model: "gemini-1.5-pro",
    avatar: "M",
    color: "cyan",
    accent: "from-cyan-300 to-sky-400",
    persona: "善于梳理资料、提出验证问题和保持证据意识。",
    style: "温和、严谨、引用条件",
    temperature: 0.58,
    maxTokens: 1500
  },
  {
    id: "agent-writer",
    name: "Lyra",
    role: "表达编辑",
    provider: "Qwen Ready",
    model: "qwen-plus",
    avatar: "L",
    color: "rose",
    accent: "from-rose-300 to-fuchsia-400",
    persona: "负责把观点转译成清晰、漂亮、有节奏的语言。",
    style: "凝练、具象、可读性优先",
    temperature: 0.78,
    maxTokens: 1300
  },
  {
    id: "agent-generalist",
    name: "Atlas",
    role: "通用助手",
    provider: "OpenAI",
    model: "gpt-4.1-mini",
    avatar: "A",
    color: "slate",
    accent: "from-slate-300 to-slate-500",
    persona: "未配置角色时使用的默认通用助手，负责清晰、准确、建设性地参与讨论。",
    style: "平衡、清楚、不过度假设",
    temperature: 0.6,
    maxTokens: 1200
  }
];

export const spaces: Space[] = [
  {
    id: "launch-strategy",
    name: "PolyMind Launch Strategy",
    topic: "如何把多 AI 讨论空间做成高留存的知识工作流产品？",
    goal: "找到 MVP 的核心体验、差异化叙事和前三周开发优先级。",
    mode: "主持人模式",
    status: "Running",
    updatedAt: "刚刚",
    agentIds: ["agent-strategist", "agent-critic", "agent-builder", "agent-writer"],
    tags: ["产品策略", "MVP", "增长"],
    summary: "团队倾向先强化讨论过程可见性，再做模板库；风险在于成本控制和默认讨论质量。",
    progress: 68,
    maxRounds: 4
  },
  {
    id: "code-review-panel",
    name: "Architecture Review Panel",
    topic: "Provider Adapter 和 Discussion Scheduler 的边界应该如何划分？",
    goal: "避免后续接入 Anthropic、Gemini、DeepSeek 时重构核心调度器。",
    mode: "轮流发言",
    status: "Completed",
    updatedAt: "2 小时前",
    agentIds: ["agent-builder", "agent-critic", "agent-researcher"],
    tags: ["架构", "Provider", "流式输出"],
    summary: "Adapter 只负责模型调用，调度器负责上下文和状态，Credential Service 单独处理密钥。",
    progress: 100,
    maxRounds: 3
  },
  {
    id: "paper-topic-lab",
    name: "Paper Topic Lab",
    topic: "多智能体协作能否提升复杂写作中的观点覆盖率？",
    goal: "提出一个可验证的论文选题和实验设计。",
    mode: "辩论模式",
    status: "Paused",
    updatedAt: "昨天",
    agentIds: ["agent-researcher", "agent-critic", "agent-writer"],
    tags: ["论文", "实验设计", "学习"],
    summary: "需要设计单 Agent 与多 Agent 的对照，并避免把风格差异误判为质量提升。",
    progress: 45,
    maxRounds: 5
  },
  {
    id: "writing-studio",
    name: "Writing Studio",
    topic: "把技术方案说明改成更有说服力的产品叙事。",
    goal: "生成一个可以放进官网和 README 的双语表达版本。",
    mode: "手动点名",
    status: "Draft",
    updatedAt: "3 天前",
    agentIds: ["agent-writer", "agent-strategist", "agent-generalist"],
    tags: ["写作改稿", "叙事", "官网"],
    summary: "还未开始讨论，已准备产品定位、目标读者和语气参考。",
    progress: 12,
    maxRounds: 2
  }
];

export const discussionMessages: DiscussionMessage[] = [
  {
    id: "m1",
    role: "user",
    round: 0,
    content:
      "我们先讨论 PolyMind 的 MVP：如何让用户第一次进入就理解它不是会议室，而是多 AI 思维讨论空间？",
    status: "completed",
    createdAt: "10:26"
  },
  {
    id: "m2",
    role: "agent",
    agentId: "agent-strategist",
    round: 1,
    content:
      "我建议把首个体验定义成一次“被组织好的思考”。用户不需要先理解智能体编排，只要输入一个主题，系统就自动推荐 3 个视角：策略、质疑、落地。这样从第一分钟开始，差异化就是可见的。",
    status: "completed",
    createdAt: "10:27"
  },
  {
    id: "m3",
    role: "agent",
    agentId: "agent-critic",
    round: 1,
    replyTo: "Nova",
    content:
      "这里的风险是“多 AI”容易变成更吵的聊天流。如果没有轮次、引用和收敛机制，用户只会看到更多文本。MVP 必须把每条发言的意图标出来：补充、质疑、澄清或总结。",
    status: "completed",
    createdAt: "10:29"
  },
  {
    id: "m4",
    role: "agent",
    agentId: "agent-builder",
    round: 2,
    replyTo: "Sable",
    content:
      "我会把这个落到界面结构：左侧显示参与者和当前状态，中间是按轮次分组的讨论流，右侧持续显示目标、调度模式和总结草稿。消息模型里保留 round、intent、agentId、status，后续接流式和重试都顺。",
    status: "completed",
    createdAt: "10:32"
  },
  {
    id: "m5",
    role: "agent",
    agentId: "agent-writer",
    round: 2,
    replyTo: "Orion",
    content:
      "表达上可以避开“会议”语言，改用 thinking space、discussion canvas、perspective loop 这类词。中文可以强调“不同模型以不同角色共同思考、辩论和总结”，把产品感放在思考质量，而不是参与人数。",
    status: "streaming",
    createdAt: "10:34"
  }
];

export const providerKeys: ProviderKey[] = [
  {
    id: "key-openai-main",
    provider: "OpenAI",
    label: "Main OpenAI Key",
    baseUrl: "https://api.openai.com/v1",
    maskedKey: "sk-...A91f",
    status: "Connected",
    lastTestedAt: "今天 09:12"
  },
  {
    id: "key-compatible-lab",
    provider: "OpenAI Compatible",
    label: "Research Lab Gateway",
    baseUrl: "https://api.example.ai/v1",
    maskedKey: "sk-...7cB2",
    status: "Needs test",
    lastTestedAt: "尚未测试"
  }
];

export const features = [
  {
    title: "Multi-agent discussion",
    description: "让多个 AI 以不同角色围绕同一主题连续补充、质疑和收敛。",
    icon: BrainCircuit
  },
  {
    title: "Configurable personas",
    description: "每个 AI 可设置模型、Provider、角色、背景、风格和任务定位。",
    icon: Wand2
  },
  {
    title: "Streaming by default",
    description: "讨论发言、当前状态和总结过程都以实时反馈呈现。",
    icon: Sparkles
  },
  {
    title: "Provider-ready architecture",
    description: "OpenAI 与 OpenAI-compatible 先行，后续平滑扩展更多 Provider。",
    icon: ShieldCheck
  }
];

export const scenarios: Scenario[] = [
  {
    title: "项目头脑风暴",
    description: "用策略、用户、落地视角快速扩展机会空间。",
    icon: Lightbulb
  },
  {
    title: "代码方案评审",
    description: "让架构师和质疑者一起检查接口、状态和风险。",
    icon: Code2
  },
  {
    title: "论文选题讨论",
    description: "把选题价值、实验设计和证据边界拆开讨论。",
    icon: FlaskConical
  },
  {
    title: "商业分析",
    description: "比较市场、成本、风险和进入策略。",
    icon: LineChart
  },
  {
    title: "学习辅导",
    description: "让导师、提问者和总结者帮助你形成理解闭环。",
    icon: Compass
  },
  {
    title: "写作改稿",
    description: "在结构、风格和说服力之间反复打磨。",
    icon: PenLine
  },
  {
    title: "产品设计讨论",
    description: "平衡用户体验、工程成本和发布节奏。",
    icon: Sparkles
  },
  {
    title: "总结报告",
    description: "把讨论沉淀为共识、分歧、行动和后续问题。",
    icon: FileText
  }
];

export const dashboardStats = {
  agentCount: agents.length,
  providerCount: providerKeys.length,
  activeSpaces: spaces.filter((space) => space.status === "Running").length,
  latestSummary:
    "MVP 应先展示可观察的多视角讨论过程，再逐步引入模板、文件上下文和更多 Provider。"
};

export function getAgentById(agentId: string) {
  return agents.find((agent) => agent.id === agentId);
}

export function getSpaceById(spaceId: string) {
  return spaces.find((space) => space.id === spaceId) ?? spaces[0];
}
