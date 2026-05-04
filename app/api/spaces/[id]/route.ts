import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/auth";
import { ApiError, handleApiError, jsonOk, parseJson } from "@/lib/server/api";
import { serializeSpace } from "@/lib/server/serializers";
import { spacePatchSchema } from "@/lib/server/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const spaceInclude = {
  members: {
    include: { agent: { include: { providerKey: { select: { keyName: true } } } } },
    orderBy: { seatOrder: "asc" as const }
  },
  runs: { orderBy: { createdAt: "desc" as const }, take: 1 }
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const space = await db.discussionSpace.findFirst({
      where: { id, userId: user.id },
      include: spaceInclude
    });

    if (!space) {
      throw new ApiError(404, "NOT_FOUND", "讨论空间不存在或无权访问。");
    }

    return jsonOk(serializeSpace(space));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const input = await parseJson(request, spacePatchSchema);
    const current = await db.discussionSpace.findFirst({
      where: { id, userId: user.id },
      select: { id: true }
    });

    if (!current) {
      throw new ApiError(404, "NOT_FOUND", "讨论空间不存在或无权访问。");
    }

    const uniqueAgentIds = input.agentIds ? Array.from(new Set(input.agentIds)) : undefined;

    if (uniqueAgentIds && uniqueAgentIds.length > 0) {
      const validAgents = await db.aiAgent.findMany({
        where: { id: { in: uniqueAgentIds }, userId: user.id },
        select: { id: true }
      });

      if (validAgents.length !== uniqueAgentIds.length) {
        throw new ApiError(400, "INVALID_AGENTS", "选择的 AI 参与者不存在或无权访问。");
      }
    }

    const space = await db.$transaction(async (tx) => {
      await tx.discussionSpace.update({
        where: { id },
        data: {
          title: input.title,
          topic: input.topic,
          goal: input.goal,
          mode: input.mode,
          maxRounds: input.maxRounds,
          autoSummary: input.autoSummary,
          status: input.status
        }
      });

      if (uniqueAgentIds) {
        await tx.spaceMember.deleteMany({ where: { spaceId: id } });
        if (uniqueAgentIds.length > 0) {
          await tx.spaceMember.createMany({
            data: uniqueAgentIds.map((agentId, index) => ({
              spaceId: id,
              agentId,
              seatOrder: index,
              enabled: true
            }))
          });
        }
      }

      return tx.discussionSpace.findUniqueOrThrow({
        where: { id },
        include: spaceInclude
      });
    });

    return jsonOk(serializeSpace(space));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const result = await db.discussionSpace.deleteMany({
      where: { id, userId: user.id }
    });

    if (result.count === 0) {
      throw new ApiError(404, "NOT_FOUND", "讨论空间不存在或无权访问。");
    }

    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
