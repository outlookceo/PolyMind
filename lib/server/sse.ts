import type { DiscussionStreamEvent } from "@/server/ai/orchestrator/ask-agent";

export function createSseResponse(events: AsyncIterable<DiscussionStreamEvent>) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of events) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      } catch (error) {
        const message = error instanceof Error ? error.message : "流式请求失败。";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              error: { message, retryable: false }
            })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
