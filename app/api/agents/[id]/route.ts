import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/auth";
import { ApiError, handleApiError, jsonOk, parseJson } from "@/lib/server/api";
import { serializeAgent } from "@/lib/server/serializers";
import { agentPatchSchema } from "@/lib/server/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const agent = await db.aiAgent.findFirst({
      where: { id, userId: user.id },
      include: { providerKey: { select: { keyName: true } } }
    });

    if (!agent) {
      throw new ApiError(404, "NOT_FOUND", "AI 参与者不存在或无权访问。");
    }

    return jsonOk(serializeAgent(agent));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const input = await parseJson(request, agentPatchSchema);

    const current = await db.aiAgent.findFirst({
      where: { id, userId: user.id },
      select: { id: true }
    });

    if (!current) {
      throw new ApiError(404, "NOT_FOUND", "AI 参与者不存在或无权访问。");
    }

    if (input.providerKeyId) {
      const key = await db.providerKey.findFirst({
        where: { id: input.providerKeyId, userId: user.id },
        select: { id: true }
      });

      if (!key) {
        throw new ApiError(400, "INVALID_PROVIDER_KEY", "Provider Key 不存在或无权访问。");
      }
    }

    const agent = await db.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.aiAgent.updateMany({
          where: { userId: user.id, isDefault: true, NOT: { id } },
          data: { isDefault: false }
        });
      }

      return tx.aiAgent.update({
        where: { id },
        data: input,
        include: { providerKey: { select: { keyName: true } } }
      });
    });

    return jsonOk(serializeAgent(agent));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const result = await db.aiAgent.deleteMany({
      where: { id, userId: user.id }
    });

    if (result.count === 0) {
      throw new ApiError(404, "NOT_FOUND", "AI 参与者不存在或无权访问。");
    }

    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
