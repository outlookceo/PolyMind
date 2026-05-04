import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { PageHeader, PageShell } from "@/components/shared/page-shell";
import { SpacesGrid } from "@/components/spaces/spaces-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SpacesPage() {
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
        description="浏览所有 AI 讨论空间，快速回到正在运行、暂停或已完成的思考链。"
        eyebrow="Spaces"
        title="Discussion spaces"
      />
      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <Input className="pl-9" placeholder="Search spaces, tags, summaries..." />
        </div>
        <div className="flex gap-2">
          {["全部", "运行中", "已完成", "草稿"].map((filter) => (
            <Button key={filter} size="sm" variant={filter === "全部" ? "secondary" : "ghost"}>
              {filter}
            </Button>
          ))}
        </div>
      </div>
      <SpacesGrid />
    </PageShell>
  );
}
