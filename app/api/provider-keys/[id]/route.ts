import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/auth";
import { ApiError, handleApiError, jsonOk } from "@/lib/server/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const result = await db.providerKey.deleteMany({
      where: { id, userId: user.id }
    });

    if (result.count === 0) {
      throw new ApiError(404, "NOT_FOUND", "Provider Key 不存在或无权访问。");
    }

    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
