import { NewSpaceForm } from "@/components/spaces/new-space-form";
import { PageHeader, PageShell } from "@/components/shared/page-shell";

export default function NewSpacePage() {
  return (
    <PageShell>
      <PageHeader
        description="用轻量步骤创建一个讨论空间：先定义问题，再选择讨论协议和 AI 参与者。"
        eyebrow="Create"
        title="New AI discussion space"
      />
      <NewSpaceForm />
    </PageShell>
  );
}
