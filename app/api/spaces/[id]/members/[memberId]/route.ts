import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/auth";
import { ApiError, handleApiError, jsonOk, parseJson } from "@/lib/server/api";
import { serializeMember } from "@/lib/server/serializers";
import { memberPatchSchema } from "@/lib/server/validation";

type RouteContext = {
  params: Promise<{ id: string; memberId: string }>;
};

async function findOwnedMember(spaceId: string, memberId: string, userId: string) {
  return db.spaceMember.findFirst({
    where: {
      id: memberId,
      spaceId,
      space: { userId }
    },
    include: { agent: { include: { providerKey: { select: { keyName: true } } } } }
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id, memberId } = await context.params;
    const input = await parseJson(request, memberPatchSchema);
    const current = await findOwnedMember(id, memberId, user.id);

    if (!current) {
      throw new ApiError(404, "NOT_FOUND", "空间成员不存在或无权访问。");
    }

    const member = await db.spaceMember.update({
      where: { id: memberId },
      data: input,
      include: { agent: { include: { providerKey: { select: { keyName: true } } } } }
    });

    return jsonOk(serializeMember(member));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id, memberId } = await context.params;
    const current = await findOwnedMember(id, memberId, user.id);

    if (!current) {
      throw new ApiError(404, "NOT_FOUND", "空间成员不存在或无权访问。");
    }

    await db.spaceMember.delete({ where: { id: memberId } });

    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
