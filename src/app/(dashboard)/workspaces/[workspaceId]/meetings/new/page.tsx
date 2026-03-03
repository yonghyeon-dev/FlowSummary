import { requireUser } from "@/modules/auth";
import { requireWorkspaceMembership } from "@/modules/workspace";
import { MeetingForm } from "./meeting-form";

export default async function NewMeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { workspaceId } = await params;
  const { error } = await searchParams;
  const user = await requireUser();
  const membership = await requireWorkspaceMembership(user.id, workspaceId);

  // Admin 이상만 업로드 가능
  if (membership.role === "MEMBER") {
    return (
      <p className="text-center text-muted-foreground py-12">
        회의를 업로드하려면 Admin 이상 권한이 필요합니다
      </p>
    );
  }

  return <MeetingForm workspaceId={workspaceId} error={error} />;
}
