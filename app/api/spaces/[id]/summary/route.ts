import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, parseJson } from "@/lib/server/api";
import { createSseResponse } from "@/lib/server/sse";
import { summarySchema } from "@/lib/server/validation";
import { generateSummary } from "@/server/ai/orchestrator/generate-summary";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const input = await parseJson(request, summarySchema);

    return createSseResponse(
      generateSummary({
        userId: user.id,
        spaceId: id,
        summaryAgentId: input.summaryAgentId
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
