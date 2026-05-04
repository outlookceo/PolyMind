"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Link2,
  Loader2,
  PlugZap,
  ShieldCheck,
  Trash2
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, formatDateTime } from "@/lib/client-api";
import type { ProviderKeyRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PROVIDER_BASE_URL_HINTS, PROVIDER_OPTIONS } from "@/server/ai/models/provider-models";

type FormState = {
  provider: string;
  keyName: string;
  apiKey: string;
  baseUrl: string;
};

const initialForm: FormState = {
  provider: "openai",
  keyName: "",
  apiKey: "",
  baseUrl: PROVIDER_BASE_URL_HINTS.openai
};

export function ApiKeysPanel() {
  const [keys, setKeys] = useState<ProviderKeyRecord[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadKeys() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ProviderKeyRecord[]>("/api/provider-keys");
      setKeys(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载 Provider Key 失败。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadKeys();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!form.keyName.trim() || !form.apiKey.trim()) {
      setError("请填写 Key 名称和 API Key。");
      return;
    }

    setSaving(true);
    try {
      await apiFetch<ProviderKeyRecord>("/api/provider-keys", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setNotice("Provider Key 已安全保存，前端只会显示脱敏结果。");
      setForm({ ...initialForm, provider: form.provider, baseUrl: form.baseUrl });
      await loadKeys();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存 Provider Key 失败。");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setError(null);
    setNotice(null);

    if (!form.apiKey.trim()) {
      setError("请先输入一个待测试的 API Key。");
      return;
    }

    setTesting(true);
    try {
      const result = await apiFetch<{ status: string; note: string }>("/api/provider-keys/test", {
        method: "POST",
        body: JSON.stringify({
          provider: form.provider,
          apiKey: form.apiKey,
          baseUrl: form.baseUrl
        })
      });
      setNotice(result.note);
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "测试连接失败。");
    } finally {
      setTesting(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setNotice(null);
    try {
      await apiFetch<{ deleted: boolean }>(`/api/provider-keys/${id}`, { method: "DELETE" });
      setKeys((current) => current.filter((key) => key.id !== id));
      setNotice("Provider Key 已删除。");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除 Provider Key 失败。");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <Card className="bg-white/[0.055]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-cyan-200" />
            添加 Provider API Key
          </CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            API Key 将通过 AES-256-GCM 在服务端加密保存，前端不会接收明文。
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Provider 类型</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {PROVIDER_OPTIONS.map((item) => (
                  <button
                    className={cn(
                      "rounded-md border px-3 py-2 text-left text-sm transition",
                      form.provider === item.value
                        ? "border-cyan-200/28 bg-cyan-300/10 text-white"
                        : "border-white/10 bg-white/[0.045] text-slate-400 hover:border-white/18"
                    )}
                    key={item.value}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        provider: item.value,
                        baseUrl: PROVIDER_BASE_URL_HINTS[item.value] || current.baseUrl
                      }))
                    }
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="key-label">Key Label</Label>
                <Input
                  id="key-label"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, keyName: event.target.value }))
                  }
                  placeholder="Main OpenAI Key"
                  value={form.keyName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, apiKey: event.target.value }))
                  }
                  placeholder="sk-..."
                  type="password"
                  value={form.apiKey}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="base-url">baseUrl</Label>
              <Input
                id="base-url"
                onChange={(event) =>
                  setForm((current) => ({ ...current, baseUrl: event.target.value }))
                }
                placeholder={
                  PROVIDER_BASE_URL_HINTS[
                    form.provider as keyof typeof PROVIDER_BASE_URL_HINTS
                  ] ?? "https://your-compatible-provider.com/v1"
                }
                value={form.baseUrl}
              />
            </div>
            <Feedback error={error} notice={notice} />
            <div className="rounded-lg border border-white/10 bg-black/16 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-cyan-200" />
                <p className="text-sm leading-6 text-slate-400">
                  真实密钥只在服务端 Credential Service 中短暂解密。API 响应只返回脱敏字符串，例如 sk-****abcd。
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button disabled={testing || saving} onClick={handleTest} type="button" variant="secondary">
                {testing ? <Loader2 className="animate-spin" /> : <PlugZap />}
                {testing ? "Testing..." : "测试连接"}
              </Button>
              <Button disabled={saving || testing} type="submit">
                {saving ? <Loader2 className="animate-spin" /> : <KeyRound />}
                {saving ? "Saving..." : "Save key"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card className="bg-white/[0.055]">
          <CardHeader>
            <CardTitle>已保存 Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <LoadingRows />
            ) : keys.length === 0 ? (
              <EmptyKeys />
            ) : (
              keys.map((key) => (
                <div className="rounded-lg border border-white/10 bg-[#11141B]/80 p-4" key={key.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium text-white">{key.keyName}</h3>
                      <p className="mt-1 text-xs text-slate-500">{key.provider}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="green">Encrypted</Badge>
                      <Button
                        aria-label={`Delete ${key.keyName}`}
                        onClick={() => void handleDelete(key.id)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <KeyRound className="size-3.5 text-slate-500" />
                      {key.maskedKey}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link2 className="size-3.5 text-slate-500" />
                      {key.baseUrl ?? "Provider default baseUrl"}
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-slate-500" />
                      Last used: {formatDateTime(key.lastUsedAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
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

function LoadingRows() {
  return (
    <div className="space-y-3">
      {[1, 2].map((item) => (
        <div className="h-28 animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" key={item} />
      ))}
    </div>
  );
}

function EmptyKeys() {
  return (
    <div className="rounded-lg border border-dashed border-white/12 bg-white/[0.035] p-6 text-center">
      <KeyRound className="mx-auto size-6 text-cyan-200" />
      <h3 className="mt-3 text-sm font-medium text-white">还没有保存 Provider Key</h3>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        添加一个 Key 后，AI 参与者就可以绑定对应 Provider 配置。
      </p>
    </div>
  );
}
