export const DISCUSSION_LIMITS = {
  maxAgentsPerRound: 6,
  defaultRecentMessages: 12,
  maxRecentMessages: 24,
  maxUserMessageChars: 6000,
  maxSummaryMessages: 36
};

export function assertUserMessageWithinLimit(message: string) {
  if (message.length > DISCUSSION_LIMITS.maxUserMessageChars) {
    throw new Error(`用户输入过长，请控制在 ${DISCUSSION_LIMITS.maxUserMessageChars} 字以内。`);
  }
}
