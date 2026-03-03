import { requireUser } from "@/modules/auth";
import { requireWorkspaceMembership } from "@/modules/workspace";
import { getActionItemsByUser } from "@/modules/action-item";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  EXTRACTED: { label: "추출됨", variant: "outline" },
  CONFIRMED: { label: "확정", variant: "secondary" },
  IN_PROGRESS: { label: "진행 중", variant: "default" },
  DONE: { label: "완료", variant: "default" },
  OVERDUE: { label: "지연", variant: "destructive" },
};

const PRIORITY_LABELS: Record<string, string> = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
};

export default async function MyTasksPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  await requireWorkspaceMembership(user.id, workspaceId);

  const items = await getActionItemsByUser(user.id, workspaceId);

  const activeItems = items.filter(
    (i) => i.status !== "DONE" && i.status !== "CANCELED"
  );
  const doneItems = items.filter((i) => i.status === "DONE");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">내 할 일</h1>

      {items.length === 0 && (
        <p className="text-muted-foreground">할당된 할 일이 없습니다.</p>
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
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {PRIORITY_LABELS[item.priority] ?? item.priority}
                        </span>
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
                          <span className="ml-2">
                            마감:{" "}
                            {new Date(item.dueDate).toLocaleDateString("ko-KR")}
                          </span>
                        )}
                      </div>
                    </div>
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
