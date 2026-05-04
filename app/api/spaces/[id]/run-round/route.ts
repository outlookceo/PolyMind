import { getCurrentUser } from "@/lib/server/auth";
import { ApiError, handleApiError } from "@/lib/server/api";
import { createSseResponse } from "@/lib/server/sse";
import { runRoundSchema } from "@/lib/server/validation";
import { runRoundRobin } from "@/server/ai/orchestrator/run-round-robin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const input = runRoundSchema.parse(await readOptionalJson(request));

    return createSseResponse(
      runRoundRobin({ userId: user.id, spaceId: id, userMessage: input.userMessage })
    );
  } catch (error) {
    return handleApiError(error);
  }
}

async function readOptionalJson(request: Request) {
  const text = await request.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(400, "INVALID_JSON", "请求体必须是合法 JSON。");
  }
}
