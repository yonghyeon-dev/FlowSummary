import { requireUser } from "@/modules/auth";
import { requireWorkspaceMembership } from "@/modules/workspace";
import { getDashboardStats } from "@/modules/dashboard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { WeeklyChart } from "./weekly-chart";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  UPLOADED: { label: "업로드됨", variant: "outline" },
  PROCESSING: { label: "처리 중", variant: "secondary" },
  REVIEW_NEEDED: { label: "검수 필요", variant: "default" },
  PUBLISHED: { label: "게시됨", variant: "default" },
  FAILED: { label: "실패", variant: "destructive" },
  ARCHIVED: { label: "보관됨", variant: "outline" },
};

const FIELD_LABELS: Record<string, string> = {
  status: "상태",
  assigneeUserId: "담당자",
  dueDate: "마감일",
  title: "제목",
};

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  await requireWorkspaceMembership(user.id, workspaceId);

  const stats = await getDashboardStats(workspaceId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>전체 회의</CardDescription>
            <CardTitle className="text-3xl">{stats.meetingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>미완료 작업</CardDescription>
            <CardTitle className="text-3xl">{stats.incompleteCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>지연 작업</CardDescription>
            <CardTitle className="text-3xl text-destructive">
              {stats.overdueCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>완료 작업</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {stats.doneCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 주간 차트 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">주간 회의 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyChart
              title=""
              data={stats.weeklyMeetingCounts}
              color="bg-primary"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">주간 작업 완료 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyChart
              title=""
              data={stats.weeklyDoneCounts}
              color="bg-green-500"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 최근 회의 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 회의</CardTitle>
            <CardDescription>최근 5건</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">회의가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentMeetings.map((meeting) => {
                  const status = STATUS_LABELS[meeting.status] ?? {
                    label: meeting.status,
                    variant: "outline" as const,
                  };
                  return (
                    <Link
                      key={meeting.id}
                      href={`/workspaces/${workspaceId}/meetings/${meeting.id}`}
                      className="flex items-center justify-between hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">{meeting.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(meeting.meetingDate).toLocaleDateString(
                            "ko-KR"
                          )}{" "}
                          · {meeting.creator.name ?? meeting.creator.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                        {meeting._count.actionItems > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {meeting._count.actionItems}건
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최근 활동 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>액션아이템 변경 이력</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActionItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">활동이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentActionItems.map((history) => (
                  <div key={history.id} className="text-sm">
                    <p>
                      <span className="font-medium">
                        {history.user.name ?? history.user.email}
                      </span>
                      {" "}
                      <span className="text-muted-foreground">
                        {FIELD_LABELS[history.field] ?? history.field} 변경
                      </span>
                      {" · "}
                      <span className="font-medium">
                        {history.actionItem.title}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {history.oldValue ?? "-"} → {history.newValue ?? "-"}
                      {" · "}
                      {new Date(history.createdAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
