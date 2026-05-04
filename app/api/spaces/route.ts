import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/auth";
import { ApiError, handleApiError, jsonOk, parseJson } from "@/lib/server/api";
import { serializeSpace } from "@/lib/server/serializers";
import { spaceCreateSchema } from "@/lib/server/validation";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const spaces = await db.discussionSpace.findMany({
      where: { userId: user.id },
      include: {
        members: {
          include: { agent: { include: { providerKey: { select: { keyName: true } } } } },
          orderBy: { seatOrder: "asc" }
        },
        runs: { orderBy: { createdAt: "desc" }, take: 1 }
      },
      orderBy: { updatedAt: "desc" }
    });

    return jsonOk(spaces.map(serializeSpace));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const input = await parseJson(request, spaceCreateSchema);
    const uniqueAgentIds = Array.from(new Set(input.agentIds));

    if (uniqueAgentIds.length > 0) {
      const validAgents = await db.aiAgent.findMany({
        where: { id: { in: uniqueAgentIds }, userId: user.id },
        select: { id: true }
      });

      if (validAgents.length !== uniqueAgentIds.length) {
        throw new ApiError(400, "INVALID_AGENTS", "选择的 AI 参与者不存在或无权访问。");
      }
    }

    const space = await db.$transaction(async (tx) => {
      const created = await tx.discussionSpace.create({
        data: {
          userId: user.id,
          title: input.title,
          topic: input.topic,
          goal: input.goal ?? null,
          mode: input.mode,
          maxRounds: input.maxRounds,
          autoSummary: input.autoSummary,
          status: uniqueAgentIds.length > 0 ? "READY" : "DRAFT"
        }
      });

      if (uniqueAgentIds.length > 0) {
        await tx.spaceMember.createMany({
          data: uniqueAgentIds.map((agentId, index) => ({
            spaceId: created.id,
            agentId,
            seatOrder: index,
            enabled: true
          }))
        });
      }

      return tx.discussionSpace.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          members: {
            include: { agent: { include: { providerKey: { select: { keyName: true } } } } },
            orderBy: { seatOrder: "asc" }
          },
          runs: { orderBy: { createdAt: "desc" }, take: 1 }
        }
      });
    });

    return jsonOk(serializeSpace(space), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
