import Link from "next/link";
import { ArrowRight, Bot, KeyRound, Layers3, Plus, Sparkles } from "lucide-react";

import { AgentAvatar } from "@/components/shared/agent-avatar";
import { StatusPill } from "@/components/shared/status-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/auth";
import { serializeAgent, serializeSpace } from "@/lib/server/serializers";

export async function DashboardOverview() {
  const user = await getCurrentUser();
  const [activeSpaceCount, agentCount, providerCount, recentSpacesRaw, recentAgentsRaw, latestRun] =
    await Promise.all([
      db.discussionSpace.count({
        where: { userId: user.id, status: { in: ["RUNNING", "READY"] } }
      }),
      db.aiAgent.count({ where: { userId: user.id } }),
      db.providerKey.count({ where: { userId: user.id } }),
      db.discussionSpace.findMany({
        where: { userId: user.id },
        include: {
          members: {
            include: { agent: { include: { providerKey: { select: { keyName: true } } } } },
            orderBy: { seatOrder: "asc" }
          },
          runs: { orderBy: { createdAt: "desc" }, take: 1 }
        },
        orderBy: { updatedAt: "desc" },
        take: 3
      }),
      db.aiAgent.findMany({
        where: { userId: user.id },
        include: { providerKey: { select: { keyName: true } } },
        orderBy: { updatedAt: "desc" },
        take: 4
      }),
      db.discussionRun.findFirst({
        where: { space: { userId: user.id }, summary: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { summary: true, spaceId: true }
      })
    ]);
  const recentSpaces = recentSpacesRaw.map(serializeSpace);
  const recentAgents = recentAgentsRaw.map(serializeAgent);
  const statCards = [
    {
      label: "Active spaces",
      value: activeSpaceCount,
      icon: Layers3,
      detail: "正在准备或运行的多 AI 讨论空间"
    },
    {
      label: "AI participants",
      value: agentCount,
      icon: Bot,
      detail: "已配置的模型、角色和发言风格"
    },
    {
      label: "Providers",
      value: providerCount,
      icon: KeyRound,
      detail: "已加密保存的 Provider API Key"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card className="bg-white/[0.055]" key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className="mt-3 text-3xl font-semibold text-white">{stat.value}</div>
                </div>
                <div className="flex size-10 items-center justify-center rounded-md border border-cyan-200/15 bg-cyan-300/10 text-cyan-100">
                  <stat.icon className="size-4" />
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-400">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-white/[0.055]">
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>最近的讨论空间</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                从真实数据库读取最近更新的 AI 讨论空间。
              </p>
            </div>
            <Button asChild size="sm" variant="secondary">
              <Link href="/spaces">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSpaces.length > 0 ? (
              recentSpaces.map((space) => (
                <Link
                  className="block rounded-lg border border-white/10 bg-[#11141B]/80 p-4 transition hover:border-cyan-200/20 hover:bg-white/[0.06]"
                  href={`/spaces/${space.id}`}
                  key={space.id}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{space.title}</h3>
                        <StatusPill status={space.status} />
                      </div>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                        {space.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {space.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="min-w-[170px]">
                      <div className="mb-2 flex justify-between text-xs text-slate-500">
                        <span>{space.mode}</span>
                        <span>{space.progress}%</span>
                      </div>
                      <Progress value={space.progress} />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-white/14 bg-white/[0.035] p-8 text-center">
                <Layers3 className="mx-auto size-7 text-cyan-200" />
                <h3 className="mt-4 text-sm font-semibold text-white">还没有讨论空间</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  创建第一个空间后，这里会显示最近讨论与进度。
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden bg-white/[0.055]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
                <Sparkles className="size-4" />
                最近一次总结
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {latestRun?.summary ??
                  "暂无总结。运行一轮讨论或点击生成总结后，结构化结论会出现在这里。"}
              </p>
              <Button asChild className="mt-5 w-full" variant="secondary">
                <Link href={latestRun ? `/spaces/${latestRun.spaceId}` : "/spaces/new"}>
                  {latestRun ? "Continue discussion" : "Create discussion"}
                  <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.055]">
            <CardHeader>
              <CardTitle>快速创建入口</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild>
                <Link href="/spaces/new">
                  <Plus />
                  New discussion space
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/agents/new">
                  <Bot />
                  Configure AI participant
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.055]">
            <CardHeader>
              <CardTitle>活跃 AI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAgents.length > 0 ? (
                recentAgents.map((agent) => (
                  <div className="flex items-center justify-between gap-3" key={agent.id}>
                    <div className="flex min-w-0 items-center gap-3">
                      <AgentAvatar avatar={agent.avatar} color={agent.color} />
                      <div className="min-w-0">
                        <div className="truncate text-sm text-white">{agent.name}</div>
                        <div className="truncate text-xs text-slate-500">
                          {agent.roleTitle ?? "通用讨论者"}
                        </div>
                      </div>
                    </div>
                    <Badge className="max-w-[140px] truncate" variant="outline">
                      {agent.model}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs leading-6 text-slate-500">
                  还没有 AI 参与者。先配置一个 Provider Key，再创建 AI。
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
