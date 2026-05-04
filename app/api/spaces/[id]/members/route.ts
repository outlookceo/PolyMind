import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/auth";
import { ApiError, handleApiError, jsonOk, parseJson } from "@/lib/server/api";
import { serializeMember } from "@/lib/server/serializers";
import { memberCreateSchema } from "@/lib/server/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const input = await parseJson(request, memberCreateSchema);
    const [space, agent] = await Promise.all([
      db.discussionSpace.findFirst({ where: { id, userId: user.id }, select: { id: true } }),
      db.aiAgent.findFirst({ where: { id: input.agentId, userId: user.id }, select: { id: true } })
    ]);

    if (!space) {
      throw new ApiError(404, "NOT_FOUND", "讨论空间不存在或无权访问。");
    }

    if (!agent) {
      throw new ApiError(400, "INVALID_AGENT", "AI 参与者不存在或无权访问。");
    }

    const member = await db.spaceMember.create({
      data: {
        spaceId: id,
        agentId: input.agentId,
        seatOrder: input.seatOrder,
        enabled: input.enabled
      },
      include: { agent: { include: { providerKey: { select: { keyName: true } } } } }
    });

    return jsonOk(serializeMember(member), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
