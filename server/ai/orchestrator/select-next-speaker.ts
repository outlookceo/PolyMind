import type { SpaceMember } from "@prisma/client";

export function selectNextSpeaker<T extends Pick<SpaceMember, "enabled" | "seatOrder">>(
  members: T[],
  currentIndex = -1
) {
  const enabledMembers = members
    .filter((member) => member.enabled)
    .sort((a, b) => a.seatOrder - b.seatOrder);

  if (enabledMembers.length === 0) return null;

  return enabledMembers[(currentIndex + 1) % enabledMembers.length];
}
