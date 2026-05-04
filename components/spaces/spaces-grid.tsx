"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Layers3 } from "lucide-react";
import Link from "next/link";

import { SpaceCard } from "@/components/spaces/space-card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client-api";
import type { SpaceRecord } from "@/lib/types";

export function SpacesGrid() {
  const [spaces, setSpaces] = useState<SpaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpaces() {
      try {
        const data = await apiFetch<SpaceRecord[]>("/api/spaces");
        setSpaces(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "加载讨论空间失败。");
      } finally {
        setLoading(false);
      }
    }

    void loadSpaces();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div
            className="h-[320px] animate-pulse rounded-lg border border-white/10 bg-white/[0.04]"
            key={item}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">
        <AlertCircle className="size-4" />
        {error}
      </div>
    );
  }

  if (spaces.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/14 bg-white/[0.035] p-10 text-center">
        <Layers3 className="mx-auto size-7 text-cyan-200" />
        <h3 className="mt-4 text-base font-semibold text-white">还没有讨论空间</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          创建第一个空间后，可以选择多个 AI 参与者围绕一个主题讨论。
        </p>
        <Button asChild className="mt-5">
          <Link href="/spaces/new">Create first space</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {spaces.map((space) => (
        <SpaceCard key={space.id} space={space} />
      ))}
    </div>
  );
}
