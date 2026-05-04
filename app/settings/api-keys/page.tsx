import { ApiKeysPanel } from "@/components/settings/api-keys-panel";
import { PageHeader, PageShell } from "@/components/shared/page-shell";

export default function ApiKeysPage() {
  return (
    <PageShell>
      <PageHeader
        description="配置 OpenAI 与 OpenAI-compatible Provider 的静态界面。真实密钥不会在此原型中被保存或调用。"
        eyebrow="Settings"
        title="Provider API keys"
      />
      <ApiKeysPanel />
    </PageShell>
  );
}
