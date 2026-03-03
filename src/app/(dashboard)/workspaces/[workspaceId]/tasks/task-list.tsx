"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateActionItem } from "@/modules/action-item";

type ActionItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  meeting: { id: string; title: string };
};

const STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "EXTRACTED", label: "추출됨" },
  { value: "CONFIRMED", label: "확정" },
  { value: "IN_PROGRESS", label: "진행 중" },
  { value: "DONE", label: "완료" },
  { value: "OVERDUE", label: "지연" },
] as const;

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  EXTRACTED: { label: "추출됨", variant: "outline" },
  CONFIRMED: { label: "확정", variant: "secondary" },
  IN_PROGRESS: { label: "진행 중", variant: "default" },
  DONE: { label: "완료", variant: "default" },
  OVERDUE: { label: "지연", variant: "destructive" },
};

const NEXT_STATUS: Record<string, { status: string; label: string } | null> = {
  EXTRACTED: { status: "CONFIRMED", label: "확정" },
  CONFIRMED: { status: "IN_PROGRESS", label: "시작" },
  IN_PROGRESS: { status: "DONE", label: "완료" },
  OVERDUE: { status: "IN_PROGRESS", label: "재개" },
  DONE: null,
  CANCELED: null,
};

export function TaskList({
  items,
  workspaceId,
}: {
  items: ActionItem[];
  workspaceId: string;
}) {
  const [filter, setFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filtered =
    filter === "all" ? items : items.filter((i) => i.status === filter);

  const activeItems = filtered.filter(
    (i) => i.status !== "DONE" && i.status !== "CANCELED"
  );
  const doneItems = filtered.filter((i) => i.status === "DONE");

  function handleStatusChange(itemId: string, newStatus: string) {
    startTransition(async () => {
      try {
        await updateActionItem(itemId, {
          status: newStatus as Parameters<typeof updateActionItem>[1]["status"],
        });
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "상태 변경에 실패했습니다");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* 상태 필터 */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const count =
            opt.value === "all"
              ? items.length
              : items.filter((i) => i.status === opt.value).length;
          return (
            <Button
              key={opt.value}
              variant={filter === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(opt.value)}
            >
              {opt.label} ({count})
            </Button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground">
          {filter === "all"
            ? "할당된 할 일이 없습니다."
            : "해당 상태의 할 일이 없습니다."}
        </p>
      )}

      {activeItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>진행 중 ({activeItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeItems.map((item) => {
                const status = STATUS_LABELS[item.status] ?? {
                  label: item.status,
                  variant: "outline" as const,
                };
                const next = NEXT_STATUS[item.status];
                const isOverdue =
                  item.dueDate && new Date(item.dueDate) < new Date() && item.status !== "DONE";
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <span className="font-medium text-sm">
                          {item.title}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <Link
                          href={`/workspaces/${workspaceId}/meetings/${item.meeting.id}`}
                          className="hover:underline"
                        >
                          {item.meeting.title}
                        </Link>
                        {item.dueDate && (
                          <span className={`ml-2 ${isOverdue ? "text-destructive font-medium" : ""}`}>
                            마감:{" "}
                            {new Date(item.dueDate).toLocaleDateString("ko-KR")}
                          </span>
                        )}
                      </div>
                    </div>
                    {next && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          handleStatusChange(item.id, next.status)
                        }
                      >
                        {next.label}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {doneItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>완료 ({doneItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {doneItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Badge variant="outline">완료</Badge>
                  <span className="line-through">{item.title}</span>
                  <Link
                    href={`/workspaces/${workspaceId}/meetings/${item.meeting.id}`}
                    className="hover:underline text-xs"
                  >
                    {item.meeting.title}
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
