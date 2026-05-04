import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, jsonOk, parseJson } from "@/lib/server/api";
import { encryptApiKey } from "@/lib/server/crypto";
import { serializeProviderKey } from "@/lib/server/serializers";
import { providerKeyCreateSchema } from "@/lib/server/validation";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const keys = await db.providerKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });

    return jsonOk(keys.map(serializeProviderKey));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const input = await parseJson(request, providerKeyCreateSchema);
    const encrypted = encryptApiKey(input.apiKey);

    const key = await db.providerKey.create({
      data: {
        userId: user.id,
        provider: input.provider,
        keyName: input.keyName,
        baseUrl: input.baseUrl ?? null,
        ...encrypted
      }
    });

    return jsonOk(serializeProviderKey(key), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
