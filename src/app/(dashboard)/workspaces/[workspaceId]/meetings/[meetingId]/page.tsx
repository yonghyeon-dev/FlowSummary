import { notFound } from "next/navigation";
import { requireUser } from "@/modules/auth";
import { requireWorkspaceMembership } from "@/modules/workspace";
import { getMeetingDetail } from "@/modules/meeting";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  const meeting = await getMeetingDetail(meetingId);
  if (!meeting || meeting.workspaceId !== workspaceId) {
    notFound();
  }

  const status = STATUS_LABELS[meeting.status];
  const summary = meeting.summaries[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{meeting.title}</h1>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="text-sm text-muted-foreground">
        {new Date(meeting.meetingDate).toLocaleDateString("ko-KR")} ·{" "}
        {meeting.creator.name ?? meeting.creator.email}
        {meeting.participants.length > 0 && (
          <> · 참석자: {meeting.participants.join(", ")}</>
        )}
      </div>

      {meeting.errorMessage && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">처리 실패</CardTitle>
            <CardDescription>{meeting.errorMessage}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* 요약 */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>요약</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{summary.summary}</p>
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

      {/* 액션 아이템 */}
      {meeting.actionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              액션 아이템 ({meeting.actionItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {meeting.actionItems.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <Badge variant="secondary">{item.status}</Badge>
                  <span className="text-sm">{item.title}</span>
                  {item.assignee && (
                    <span className="text-xs text-muted-foreground">
                      → {item.assignee.name ?? item.assignee.email}
                    </span>
                  )}
                </li>
              ))}
            </ul>
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
