import Link from "next/link";
import { Plus } from "lucide-react";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { PageHeader, PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <PageShell>
      <PageHeader
        action={
          <Button asChild>
            <Link href="/spaces/new">
              <Plus />
              New space
            </Link>
          </Button>
        }
        description="查看最近讨论、AI 参与者、Provider 配置和最新总结，快速进入下一次思考。"
        eyebrow="Overview"
        title="Your AI thinking workspace"
      />
      <DashboardOverview />
    </PageShell>
  );
}
