import { notFound } from "next/navigation";
import { requireUser } from "@/modules/auth";
import { requireWorkspaceMembership, getWorkspaceWithMembers } from "@/modules/workspace";
import { getMeetingDetail } from "@/modules/meeting";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MeetingActions } from "./meeting-actions";
import { SummaryReview } from "./summary-review";
import { ActionItemCard } from "./action-item-card";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  UPLOADED: { label: "업로드됨", variant: "outline" },
  PROCESSING: { label: "처리 중", variant: "secondary" },
  REVIEW_NEEDED: { label: "검수 필요", variant: "default" },
  PUBLISHED: { label: "게시됨", variant: "default" },
  FAILED: { label: "실패", variant: "destructive" },
  ARCHIVED: { label: "보관됨", variant: "outline" },
};

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string; meetingId: string }>;
}) {
  const { workspaceId, meetingId } = await params;
  const user = await requireUser();
  await requireWorkspaceMembership(user.id, workspaceId);

  const [meeting, workspace] = await Promise.all([
    getMeetingDetail(meetingId),
    getWorkspaceWithMembers(workspaceId),
  ]);

  if (!meeting || meeting.workspaceId !== workspaceId) {
    notFound();
  }

  const status = STATUS_LABELS[meeting.status];
  const summary = meeting.summaries[0];
  const isReviewMode = meeting.status === "REVIEW_NEEDED";

  const members = (workspace?.memberships ?? []).map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
  }));

  const unconfirmedCount = meeting.actionItems.filter(
    (item) => item.status === "EXTRACTED"
  ).length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{meeting.title}</h1>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <MeetingActions
          meetingId={meetingId}
          status={meeting.status}
          hasSegments={meeting.segments.length > 0}
          hasSummary={!!summary}
        />
      </div>

      <div className="text-sm text-muted-foreground">
        {new Date(meeting.meetingDate).toLocaleDateString("ko-KR")} ·{" "}
        {meeting.creator.name ?? meeting.creator.email}
        {meeting.participants.length > 0 && (
          <> · 참석자: {meeting.participants.join(", ")}</>
        )}
      </div>

      {/* 게시 전 미확정 경고 */}
      {isReviewMode && unconfirmedCount > 0 && summary && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          미확정 액션아이템이 {unconfirmedCount}건 있습니다. 게시 전에 확인해주세요.
        </div>
      )}

      {/* 에러 메시지 */}
      {meeting.errorMessage && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">처리 실패</CardTitle>
            <CardDescription>{meeting.errorMessage}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* 요약 (검수 모드) */}
      {summary && (
        <SummaryReview
          summary={{
            id: summary.id,
            summary: summary.summary,
            keyDecisions: summary.keyDecisions as { decision: string; context: string }[] | null,
            version: summary.version,
            modelId: summary.modelId,
            promptVersion: summary.promptVersion,
          }}
          isReviewMode={isReviewMode}
        />
      )}

      {/* 액션 아이템 */}
      {meeting.actionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              액션 아이템 ({meeting.actionItems.length})
              {unconfirmedCount > 0 && (
                <Badge variant="outline" className="ml-2 text-xs">
                  미확정 {unconfirmedCount}건
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {meeting.actionItems.map((item) => (
              <ActionItemCard
                key={item.id}
                item={{
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  status: item.status,
                  priority: item.priority,
                  dueDate: item.dueDate
                    ? item.dueDate.toISOString()
                    : null,
                  dueDateRaw: item.dueDateRaw,
                  confidence: item.confidence,
                  sourceText: item.sourceText,
                  assignee: item.assignee,
                }}
                members={members}
                isReviewMode={isReviewMode}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* 전사 타임라인 */}
      {meeting.segments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>전사 내용</CardTitle>
            <CardDescription>
              {meeting.segments.length}개 세그먼트
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {meeting.segments.map((seg) => (
                <div key={seg.id} className="flex gap-3">
                  {!meeting.isTextPaste && (
                    <div className="flex flex-col items-center">
                      <Badge variant="outline" className="text-xs">
                        {seg.speakerName ?? seg.speakerLabel}
                      </Badge>
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatTime(seg.startTime)}
                      </span>
                    </div>
                  )}
                  <p className="flex-1 text-sm whitespace-pre-wrap">
                    {seg.text}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
