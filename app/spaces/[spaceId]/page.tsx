import { notFound } from "next/navigation";

import { DiscussionRoom } from "@/components/discussion/discussion-room";
import { PageShell } from "@/components/shared/page-shell";
import { getOwnedSpaceDetail } from "@/lib/server/space-queries";

export default async function SpaceDetailPage({
  params
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  const detail = await getOwnedSpaceDetail(spaceId);

  if (!detail) {
    notFound();
  }

  return (
    <PageShell className="max-w-[1540px]">
      <DiscussionRoom initialMessages={detail.messages} space={detail.space} />
    </PageShell>
  );
}
