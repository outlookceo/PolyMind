import { NewAgentForm } from "@/components/agents/new-agent-form";
import { PageHeader, PageShell } from "@/components/shared/page-shell";

export default function NewAgentPage() {
  return (
    <PageShell>
      <PageHeader
        description="创建一个可加入讨论空间的 AI 参与者。除模型与 Provider 外，角色和人设信息都可以留空。"
        eyebrow="Create"
        title="New AI participant"
      />
      <NewAgentForm />
    </PageShell>
  );
}
