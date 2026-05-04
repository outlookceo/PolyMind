import type { DiscussionMessage } from "@prisma/client";

export function summarizeHistory(messages: DiscussionMessage[]) {
  if (messages.length === 0) {
    return "暂无历史消息。";
  }

  return messages
    .map((message) => {
      const speaker =
        message.senderType === "USER"
          ? "用户"
          : message.senderType === "SUMMARY"
            ? "总结"
            : message.senderAgentId
              ? `AI:${message.senderAgentId}`
              : "系统";
      return `[Round ${message.roundIndex}] ${speaker}: ${message.content}`;
    })
    .join("\n\n");
}
