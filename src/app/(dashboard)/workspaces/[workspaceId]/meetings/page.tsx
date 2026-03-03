import Link from "next/link";
import { requireUser } from "@/modules/auth";
import { requireWorkspaceMembership } from "@/modules/workspace";
import { getMeetingsByWorkspace } from "@/modules/meeting";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  UPLOADED: { label: "업로드됨", variant: "outline" },
  PROCESSING: { label: "처리 중", variant: "secondary" },
  REVIEW_NEEDED: { label: "검수 필요", variant: "default" },
  PUBLISHED: { label: "게시됨", variant: "default" },
  FAILED: { label: "실패", variant: "destructive" },
  ARCHIVED: { label: "보관됨", variant: "outline" },
};

export default async function MeetingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ archived?: string }>;
}) {
  const { workspaceId } = await params;
  const { archived } = await searchParams;
  const showArchived = archived === "true";
  const user = await requireUser();
  await requireWorkspaceMembership(user.id, workspaceId);
  const meetings = await getMeetingsByWorkspace(workspaceId, {
    includeArchived: showArchived,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">회의</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link
              href={`/workspaces/${workspaceId}/meetings${showArchived ? "" : "?archived=true"}`}
            >
              {showArchived ? "활성 보기" : "보관함 보기"}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/workspaces/${workspaceId}/meetings/new`}>
              새 회의
            </Link>
          </Button>
        </div>
      </div>

      {meetings.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          아직 회의가 없습니다
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>날짜</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>작업</TableHead>
              <TableHead>작성자</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.map((meeting) => {
              const status = STATUS_LABELS[meeting.status];
              return (
                <TableRow key={meeting.id}>
                  <TableCell>
                    <Link
                      href={`/workspaces/${workspaceId}/meetings/${meeting.id}`}
                      className="font-medium hover:underline"
                    >
                      {meeting.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {new Date(meeting.meetingDate).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>{meeting._count.actionItems}</TableCell>
                  <TableCell>
                    {meeting.creator.name ?? meeting.creator.email}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
