import { db } from "@/lib/db";
import {
  askAgent,
  getNextRoundIndex,
  getOwnedSpaceWithMembers,
  serializeMessage,
  type DiscussionStreamEvent
} from "@/server/ai/orchestrator/ask-agent";
import { DISCUSSION_LIMITS, assertUserMessageWithinLimit } from "@/server/ai/safety/limits";

export async function* runRoundRobin({
  userId,
  spaceId,
  userMessage
}: {
  userId: string;
  spaceId: string;
  userMessage?: string;
}): AsyncIterable<DiscussionStreamEvent> {
  if (userMessage) {
    assertUserMessageWithinLimit(userMessage);
  }

  const space = await getOwnedSpaceWithMembers(userId, spaceId);
  const roundIndex = await getNextRoundIndex(spaceId);
  const members = space.members
    .filter((member) => member.enabled)
    .sort((a, b) => a.seatOrder - b.seatOrder)
    .slice(0, DISCUSSION_LIMITS.maxAgentsPerRound);

  if (members.length === 0) {
    yield {
      type: "error",
      error: { message: "当前讨论空间没有可用 AI 参与者。", retryable: false }
    };
    return;
  }

  const run = await db.discussionRun.create({
    data: {
      spaceId,
      status: "RUNNING",
      currentRound: roundIndex
    }
  });

  if (userMessage) {
    const savedUserMessage = await db.discussionMessage.create({
      data: {
        spaceId,
        senderType: "USER",
        content: userMessage,
        roundIndex
      }
    });
    yield { type: "user.message", message: serializeMessage(savedUserMessage) };
  }

  for (const member of members) {
    for await (const event of askAgent({
      userId,
      spaceId,
      agentId: member.agentId,
      userMessage,
      roundIndex,
      saveUserMessage: false
    })) {
      yield event;
      if (event.type === "error") {
        break;
      }
    }
  }

  await db.discussionRun.update({
    where: { id: run.id },
    data: {
      status: "COMPLETED",
      currentRound: roundIndex,
      endedAt: new Date()
    }
  });
}
