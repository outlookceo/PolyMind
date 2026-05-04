import {
  Bot,
  BrainCircuit,
  FileText,
  FlaskConical,
  Lightbulb,
  PenLine,
  Scale,
  Sparkles
} from "lucide-react";

export const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/spaces", label: "Spaces" },
  { href: "/agents", label: "Agents" },
  { href: "/settings/api-keys", label: "API Keys" }
];

export const discussionModes = [
  "手动点名",
  "轮流发言",
  "主持人模式",
  "辩论模式"
] as const;

export const scenarioIcons = {
  "项目头脑风暴": Lightbulb,
  "代码方案评审": BrainCircuit,
  "论文选题讨论": FlaskConical,
  "商业分析": Scale,
  "学习辅导": Bot,
  "写作改稿": PenLine,
  "产品设计讨论": Sparkles,
  "总结报告": FileText
};
