"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Member {
  id: string;
  name: string | null;
  email: string;
}

interface ActionItemData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  dueDateRaw: string | null;
  confidence: number;
  sourceText: string | null;
  assignee: { id: string; name: string | null; email: string } | null;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  EXTRACTED: { label: "추출됨", variant: "outline" },
  CONFIRMED: { label: "확정", variant: "secondary" },
  IN_PROGRESS: { label: "진행 중", variant: "default" },
  DONE: { label: "완료", variant: "default" },
  OVERDUE: { label: "지연", variant: "destructive" },
  CANCELED: { label: "취소", variant: "outline" },
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  HIGH: { label: "높음", color: "text-red-600" },
  MEDIUM: { label: "보통", color: "text-yellow-600" },
  LOW: { label: "낮음", color: "text-gray-500" },
};

export function ActionItemCard({
  item,
  members,
  isReviewMode,
}: {
  item: ActionItemData;
  members: Member[];
  isReviewMode: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assigneeId, setAssigneeId] = useState(item.assignee?.id ?? "");
  const [dueDate, setDueDate] = useState(
    item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : ""
  );

  const status = STATUS_LABELS[item.status] ?? { label: item.status, variant: "outline" as const };
  const priority = PRIORITY_LABELS[item.priority] ?? PRIORITY_LABELS.MEDIUM;
  const isLowConfidence = item.confidence < 0.75;

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/action-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CONFIRMED",
          assigneeUserId: assigneeId || null,
          dueDate: dueDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "업데이트 실패");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      alert("요청 실패");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/action-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "상태 변경 실패");
        return;
      }
      router.refresh();
    } catch {
      alert("요청 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className={`text-xs font-medium ${priority.color}`}>
              {priority.label}
            </span>
            {isLowConfidence && (
              <Badge variant="destructive" className="text-xs">
                확인 필요
              </Badge>
            )}
            <span className="font-medium text-sm">{item.title}</span>
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {item.assignee && (
              <span>담당: {item.assignee.name ?? item.assignee.email}</span>
            )}
            {item.dueDate && (
              <span>
                마감: {new Date(item.dueDate).toLocaleDateString("ko-KR")}
              </span>
            )}
            {!item.dueDate && item.dueDateRaw && (
              <span>마감(원문): {item.dueDateRaw}</span>
            )}
          </div>
        </div>

        {isReviewMode && item.status === "EXTRACTED" && !editing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
          >
            확정
          </Button>
        )}

        {!isReviewMode && item.status === "CONFIRMED" && (
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => handleStatusChange("IN_PROGRESS")}
          >
            시작
          </Button>
        )}

        {!isReviewMode && item.status === "IN_PROGRESS" && (
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => handleStatusChange("DONE")}
          >
            완료
          </Button>
        )}
      </div>

      {editing && (
        <div className="flex items-end gap-2 pt-2 border-t">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">담당자</label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="담당자 선택" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name ?? m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">마감일</label>
            <Input
              type="date"
              className="h-8"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={handleConfirm} disabled={loading}>
            {loading ? "저장 중..." : "확정"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(false)}
          >
            취소
          </Button>
        </div>
      )}

      {item.sourceText && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">원문 보기</summary>
          <p className="mt-1 pl-2 border-l-2">{item.sourceText}</p>
        </details>
      )}
    </div>
  );
}
