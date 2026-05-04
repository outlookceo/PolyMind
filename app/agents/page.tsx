import Link from "next/link";
import { Plus } from "lucide-react";

import { AgentGrid } from "@/components/agents/agent-grid";
import { PageHeader, PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";

export default function AgentsPage() {
  return (
    <PageShell>
      <PageHeader
        action={
          <Button asChild>
            <Link href="/agents/new">
              <Plus />
              New agent
            </Link>
          </Button>
        }
        description="管理不同模型、Provider、角色、人设和发言风格的 AI 参与者。"
        eyebrow="Agents"
        title="AI participants"
      />
      <AgentGrid />
    </PageShell>
  );
}
