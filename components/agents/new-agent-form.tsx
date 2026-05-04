"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Bot,
  BrainCircuit,
  CheckCircle2,
  KeyRound,
  Loader2,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/client-api";
import type { AgentRecord, ProviderKeyRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  PROVIDER_BASE_URL_HINTS,
  PROVIDER_MODEL_PRESETS,
  PROVIDER_OPTIONS
} from "@/server/ai/models/provider-models";

type AgentFormState = {
  name: string;
  provider: string;
  model: string;
  providerKeyId: string;
  roleTitle: string;
  backgroundInfo: string;
  persona: string;
  speakingStyle: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
};

const initialForm: AgentFormState = {
  name: "",
  provider: "openai",
  model: "gpt-4.1-mini",
  providerKeyId: "",
  roleTitle: "",
  backgroundInfo: "",
  persona: "",
  speakingStyle: "",
  systemPrompt: "",
  temperature: 0.6,
  maxTokens: 1200,
  isDefault: false
};

export function NewAgentForm() {
  const router = useRouter();
  const [form, setForm] = useState<AgentFormState>(initialForm);
  const [providerKeys, setProviderKeys] = useState<ProviderKeyRecord[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadProviderKeys() {
      try {
        const keys = await apiFetch<ProviderKeyRecord[]>("/api/provider-keys");
        setProviderKeys(keys);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "加载 Provider Key 失败。");
      } finally {
        setLoadingKeys(false);
      }
    }

    void loadProviderKeys();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!form.name.trim() || !form.provider.trim() || !form.model.trim()) {
      setError("AI 名称、Provider 和模型名称必填。");
      return;
    }

    setSaving(true);
    try {
      const created = await apiFetch<AgentRecord>("/api/agents", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          providerKeyId: form.providerKeyId || null
        })
      });
      setNotice(`${created.name} 已创建。正在返回 AI 参与者列表。`);
      router.push("/agents");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "创建 AI 参与者失败。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
      <aside className="space-y-4">
        <div className="rounded-lg border border-cyan-200/20 bg-cyan-300/10 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
            <Sparkles className="size-4" />
            可选设定
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            角色、人设、背景信息和系统提示词都可以不填写。留空时，系统后续会使用默认通用助手设定。
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
          <h3 className="text-sm font-semibold text-white">默认通用助手设定</h3>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            清晰、准确、建设性地参与讨论；回应前面观点；说明不确定性；输出具体、可执行的建议。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline">Generalist</Badge>
            <Badge variant="outline">Safe default</Badge>
          </div>
        </div>
      </aside>
      <form
        className="space-y-5 rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-glow"
        onSubmit={handleSubmit}
      >
        <SectionTitle icon={Bot} title="基础配置" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="agent-name"
            label="AI 名称"
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            placeholder="例如：Nova"
            value={form.name}
          />
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <select
              className="flex h-11 w-full rounded-md border border-white/10 bg-white/[0.055] px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-300/35 focus:ring-2 focus:ring-blue-400/15"
              id="provider"
              onChange={(event) => {
                const provider = event.target.value as keyof typeof PROVIDER_MODEL_PRESETS;
                const firstModel = PROVIDER_MODEL_PRESETS[provider]?.[0]?.value;
                setForm((current) => ({
                  ...current,
                  provider,
                  model: firstModel ?? current.model,
                  providerKeyId: ""
                }));
              }}
              value={form.provider}
            >
              {PROVIDER_OPTIONS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
            <p className="text-xs leading-5 text-slate-500">
              默认 baseUrl：
              {PROVIDER_BASE_URL_HINTS[form.provider as keyof typeof PROVIDER_BASE_URL_HINTS]}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              list="model-presets"
              onChange={(event) =>
                setForm((current) => ({ ...current, model: event.target.value }))
              }
              placeholder="选择预设或手动输入模型名"
              value={form.model}
            />
            <datalist id="model-presets">
              {(PROVIDER_MODEL_PRESETS[
                form.provider as keyof typeof PROVIDER_MODEL_PRESETS
              ] ?? []).map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key 配置选择</Label>
            <select
              className="flex h-11 w-full rounded-md border border-white/10 bg-white/[0.055] px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-300/35 focus:ring-2 focus:ring-blue-400/15"
              disabled={loadingKeys}
              id="api-key"
              onChange={(event) =>
                setForm((current) => ({ ...current, providerKeyId: event.target.value }))
              }
              value={form.providerKeyId}
            >
              <option value="">不绑定，稍后配置</option>
              {providerKeys
                .filter(
                  (key) =>
                    normalizeProviderValue(key.provider) === form.provider ||
                    form.provider === "openai-compatible"
                )
                .map((key) => (
                <option key={key.id} value={key.id}>
                  {key.keyName} · {key.provider} · {key.maskedKey}
                </option>
              ))}
            </select>
            {form.provider === "openai-compatible" ? (
              <p className="text-xs leading-5 text-slate-500">
                OpenAI-compatible 的 baseUrl 在 Provider Key 中配置，可接入 Qwen、硅基流动、火山方舟或本地模型。
              </p>
            ) : null}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/16 p-4">
          <SectionTitle icon={BrainCircuit} title="角色与人设（可选）" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              id="role-name"
              label="角色名称"
              onChange={(value) => setForm((current) => ({ ...current, roleTitle: value }))}
              placeholder="产品策略师、架构师、审稿人..."
              value={form.roleTitle}
            />
            <Field
              id="speaking-style"
              label="发言风格"
              onChange={(value) => setForm((current) => ({ ...current, speakingStyle: value }))}
              placeholder="审慎、直接、温和、结构化..."
              value={form.speakingStyle}
            />
          </div>
          <div className="mt-4 space-y-4">
            <TextField
              id="background"
              label="背景信息"
              onChange={(value) => setForm((current) => ({ ...current, backgroundInfo: value }))}
              placeholder="这个 AI 应该知道哪些背景？可留空。"
              value={form.backgroundInfo}
            />
            <TextField
              id="persona"
              label="人设描述"
              onChange={(value) => setForm((current) => ({ ...current, persona: value }))}
              placeholder="描述它的关注点、思考方式和边界。可留空。"
              value={form.persona}
            />
            <TextField
              id="system-prompt"
              label="系统提示词"
              onChange={(value) => setForm((current) => ({ ...current, systemPrompt: value }))}
              placeholder="高级用户可自定义 system prompt。可留空。"
              value={form.systemPrompt}
            />
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/16 p-4">
          <SectionTitle icon={SlidersHorizontal} title="模型参数" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="temperature">temperature：{form.temperature.toFixed(2)}</Label>
              <input
                className="w-full accent-cyan-300"
                id="temperature"
                max={1}
                min={0}
                onChange={(event) =>
                  setForm((current) => ({ ...current, temperature: Number(event.target.value) }))
                }
                step={0.01}
                type="range"
                value={form.temperature}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-tokens">max tokens：{form.maxTokens}</Label>
              <input
                className="w-full accent-cyan-300"
                id="max-tokens"
                max={3200}
                min={400}
                onChange={(event) =>
                  setForm((current) => ({ ...current, maxTokens: Number(event.target.value) }))
                }
                step={100}
                type="range"
                value={form.maxTokens}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
            <div>
              <div className="text-sm font-medium text-white">设为默认助手</div>
              <div className="text-xs text-slate-500">未指定角色时优先使用这个 AI。</div>
            </div>
            <Switch
              checked={form.isDefault}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, isDefault: checked }))
              }
            />
          </div>
        </div>
        <Feedback error={error} notice={notice} />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => router.push("/agents")}>
            Cancel
          </Button>
          <Button disabled={saving} type="submit">
            {saving ? <Loader2 className="animate-spin" /> : <KeyRound />}
            {saving ? "Creating..." : "Create agent"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function normalizeProviderValue(provider: string) {
  return provider.trim().toLowerCase().replace(/\s+/g, "-");
}

function Field({
  id,
  label,
  placeholder,
  value,
  onChange
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </div>
  );
}

function TextField({
  id,
  label,
  placeholder,
  value,
  onChange
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-white">
      <Icon className="size-4 text-cyan-200" />
      {title}
    </div>
  );
}

function Feedback({ error, notice }: { error: string | null; notice: string | null }) {
  if (!error && !notice) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border p-3 text-sm leading-6",
        error
          ? "border-red-300/20 bg-red-400/10 text-red-100"
          : "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
      )}
    >
      {error ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
      {error ?? notice}
    </div>
  );
}
