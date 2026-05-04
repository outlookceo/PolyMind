import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/auth";
import { serializeMessage, serializeSpace } from "@/lib/server/serializers";

export async function getOwnedSpaceDetail(spaceId: string) {
  const user = await getCurrentUser();
  const space = await db.discussionSpace.findFirst({
    where: { id: spaceId, userId: user.id },
    include: {
      members: {
        include: { agent: { include: { providerKey: { select: { keyName: true } } } } },
        orderBy: { seatOrder: "asc" }
      },
      runs: { orderBy: { createdAt: "desc" }, take: 1 }
    }
  });

  if (!space) return null;

  const messages = await db.discussionMessage.findMany({
    where: { spaceId: space.id },
    orderBy: { createdAt: "asc" }
  });

  return {
    space: serializeSpace(space),
    messages: messages.map(serializeMessage)
  };
}
