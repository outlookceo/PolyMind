import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/auth";
import { ApiError, handleApiError, jsonOk, parseJson } from "@/lib/server/api";
import { serializeAgent } from "@/lib/server/serializers";
import { agentCreateSchema } from "@/lib/server/validation";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const agents = await db.aiAgent.findMany({
      where: { userId: user.id },
      include: { providerKey: { select: { keyName: true } } },
      orderBy: { createdAt: "desc" }
    });

    return jsonOk(agents.map(serializeAgent));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const input = await parseJson(request, agentCreateSchema);

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
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false }
        });
      }

      return tx.aiAgent.create({
        data: {
          userId: user.id,
          name: input.name,
          avatarUrl: input.avatarUrl ?? null,
          provider: input.provider,
          model: input.model,
          providerKeyId: input.providerKeyId ?? null,
          roleTitle: input.roleTitle ?? null,
          backgroundInfo: input.backgroundInfo ?? null,
          persona: input.persona ?? null,
          speakingStyle: input.speakingStyle ?? null,
          systemPrompt: input.systemPrompt ?? null,
          temperature: input.temperature,
          maxTokens: input.maxTokens,
          isDefault: input.isDefault
        },
        include: { providerKey: { select: { keyName: true } } }
      });
    });

    return jsonOk(serializeAgent(agent), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
