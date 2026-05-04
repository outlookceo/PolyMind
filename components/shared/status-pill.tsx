import { Badge } from "@/components/ui/badge";

const statusVariant: Record<string, "blue" | "amber" | "outline" | "green"> = {
  Running: "blue",
  Paused: "amber",
  Draft: "outline",
  Completed: "green",
  RUNNING: "blue",
  PAUSED: "amber",
  DRAFT: "outline",
  READY: "blue",
  COMPLETED: "green"
};

const statusLabel: Record<string, string> = {
  Running: "运行中",
  Paused: "已暂停",
  Draft: "草稿",
  Completed: "已完成",
  RUNNING: "运行中",
  PAUSED: "已暂停",
  DRAFT: "草稿",
  READY: "已就绪",
  COMPLETED: "已完成"
};

export function StatusPill({ status }: { status: string }) {
  return (
    <Badge variant={statusVariant[status] ?? "outline"}>
      {statusLabel[status] ?? status}
    </Badge>
  );
}
