import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/auth";
import { ApiError, handleApiError, jsonOk, parseJson } from "@/lib/server/api";
import { serializeMessage } from "@/lib/server/serializers";
import { messageCreateSchema } from "@/lib/server/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const space = await db.discussionSpace.findFirst({
      where: { id, userId: user.id },
      select: { id: true }
    });

    if (!space) {
      throw new ApiError(404, "NOT_FOUND", "讨论空间不存在或无权访问。");
    }

    const messages = await db.discussionMessage.findMany({
      where: { spaceId: id },
      orderBy: { createdAt: "asc" }
    });

    return jsonOk(messages.map(serializeMessage));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const input = await parseJson(request, messageCreateSchema);
    const space = await db.discussionSpace.findFirst({
      where: { id, userId: user.id },
      select: { id: true }
    });

    if (!space) {
      throw new ApiError(404, "NOT_FOUND", "讨论空间不存在或无权访问。");
    }

    if (input.senderAgentId) {
      const member = await db.spaceMember.findUnique({
        where: { spaceId_agentId: { spaceId: id, agentId: input.senderAgentId } },
        select: { id: true }
      });

      if (!member) {
        throw new ApiError(400, "INVALID_AGENT", "发送者 AI 不属于该讨论空间。");
      }
    }

    const message = await db.discussionMessage.create({
      data: {
        spaceId: id,
        senderType: input.senderType,
        senderAgentId: input.senderAgentId ?? null,
        content: input.content,
        roundIndex: input.roundIndex,
        metadataJson:
          input.metadataJson === undefined
            ? undefined
            : (input.metadataJson as Prisma.InputJsonValue)
      }
    });

    return jsonOk(serializeMessage(message), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
