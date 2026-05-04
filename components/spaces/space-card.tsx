import Link from "next/link";
import { ArrowRight, UsersRound } from "lucide-react";

import { AgentAvatar } from "@/components/shared/agent-avatar";
import { StatusPill } from "@/components/shared/status-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDateTime } from "@/lib/client-api";
import type { SpaceRecord } from "@/lib/types";

export function SpaceCard({ space }: { space: SpaceRecord }) {
  const enabledMembers = space.members.filter((member) => member.enabled);

  return (
    <Card className="group overflow-hidden bg-white/[0.052] transition duration-200 hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.068]">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusPill status={space.status} />
          <span className="text-xs text-slate-500">{formatDateTime(space.updatedAt)}</span>
        </div>
        <h2 className="mt-5 text-xl font-semibold tracking-normal text-white">{space.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">{space.topic}</p>
        <p className="mt-4 rounded-md border border-white/10 bg-black/18 p-3 text-sm leading-6 text-slate-300">
          {space.summary}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {space.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
          {space.autoSummary ? <Badge variant="cyan">Auto summary</Badge> : null}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {enabledMembers.slice(0, 4).map((member) => (
                <AgentAvatar
                  avatar={member.agent.avatar}
                  className="size-8 border-[#11141B]"
                  color={member.agent.color}
                  key={member.id}
                />
              ))}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <UsersRound className="size-3.5" />
              {space.memberCount} AI
            </div>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/spaces/${space.id}`}>
              Enter
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs text-slate-500">
            <span>{space.mode}</span>
            <span>{space.progress}%</span>
          </div>
          <Progress value={space.progress} />
        </div>
      </CardContent>
    </Card>
  );
}
