import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/auth";
import { ApiError, handleApiError, jsonOk, parseJson } from "@/lib/server/api";
import { decryptApiKey } from "@/lib/server/crypto";
import { providerKeyTestSchema } from "@/lib/server/validation";
import { getProviderAdapter } from "@/server/ai/providers";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const input = await parseJson(request, providerKeyTestSchema);
    let apiKey = input.apiKey;
    let baseUrl = input.baseUrl ?? null;

    if (input.providerKeyId) {
      const savedKey = await db.providerKey.findFirst({
        where: { id: input.providerKeyId, userId: user.id }
      });

      if (!savedKey) {
        throw new ApiError(404, "NOT_FOUND", "Provider Key 不存在或无权访问。");
      }

      apiKey = decryptApiKey(savedKey);
      baseUrl = savedKey.baseUrl;
    }

    if (!apiKey) {
      throw new ApiError(400, "MISSING_API_KEY", "请提供 API Key。");
    }

    const adapter = getProviderAdapter(input.provider);
    await adapter.validateKey({
      provider: input.provider,
      apiKey,
      baseUrl,
      model: adapter.defaultModel
    });

    return jsonOk({
      status: "Connected",
      provider: input.provider,
      baseUrl,
      checkedAt: new Date().toISOString(),
      note: "Provider 连通性检查已通过。"
    });
  } catch (error) {
    return handleApiError(error);
  }
}
