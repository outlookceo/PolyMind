import type { AiAgent, DiscussionSpace, ProviderKey, SpaceMember } from "@prisma/client";

type AgentWithKey = AiAgent & { providerKey?: Pick<ProviderKey, "keyName"> | null };
type MemberWithAgent = SpaceMember & { agent: AgentWithKey };

export function buildAgentSystemPrompt({
  space,
  agent,
  members,
  task
}: {
  space: DiscussionSpace;
  agent: AgentWithKey;
  members: MemberWithAgent[];
  task: "manual" | "round-robin" | "summary";
}) {
  const otherParticipants = members
    .filter((member) => member.agentId !== agent.id && member.enabled)
    .map((member) => {
      const other = member.agent;
      return `- ${other.name}：${other.provider} / ${other.model}，角色：${other.roleTitle ?? "通用讨论者"}，描述：${other.persona ?? "无特殊描述"}`;
    })
    .join("\n");

  const roleTitle = agent.roleTitle ?? "通用讨论者";
  const backgroundInfo = agent.backgroundInfo ?? "无特殊背景设定";
  const persona = agent.persona ?? "理性、清晰、协作";
  const speakingStyle = agent.speakingStyle ?? "结构清楚、简洁、有信息量";
  const customPrompt = agent.systemPrompt
    ? `\n用户自定义 systemPrompt：\n${agent.systemPrompt}\n`
    : "";

  const taskInstruction =
    task === "summary"
      ? "你当前任务是生成讨论总结，区分核心结论、分歧、行动清单和后续问题。"
      : task === "manual"
        ? "你当前任务是回应用户刚刚点名提出的问题，同时结合已有讨论上下文。"
        : "你当前任务是基于前面讨论进行补充、质疑、推进或阶段性总结。";

  return `你正在参与一个多 AI 讨论空间。这个产品不是普通单 AI 聊天，你是多个 AI 讨论参与者之一。

讨论空间：
- 主题：${space.topic}
- 目标：${space.goal ?? "无特别目标"}
- 模式：${space.mode}

你的身份：
- 名称：${agent.name}
- Provider：${agent.provider}
- 模型：${agent.model}
- 角色：${roleTitle}
- 背景信息：${backgroundInfo}
- 人设：${persona}
- 发言风格：${speakingStyle}
${customPrompt}
其他 AI 参与者：
${otherParticipants || "- 暂无其他 AI 参与者"}

讨论要求：
- 围绕当前主题发言。
- 参考已有讨论上下文。
- 不要重复其他 AI 已经说过的内容。
- 可以补充、质疑、反驳、澄清风险或推进结论。
- 发言要体现你的角色和模型定位。
- 尽量结构清楚、信息密度高、可执行。
- 不要寒暄。
- 不要说“作为一个 AI 语言模型”。
- 如果信息不足，请直接说明不确定性。

当前任务：
${taskInstruction}`;
}
