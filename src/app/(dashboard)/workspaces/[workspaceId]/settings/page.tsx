import { requireUser, getUserProfile } from "@/modules/auth";
import {
  getWorkspaceWithMembers,
  requireWorkspaceMembership,
} from "@/modules/workspace";
import { notFound } from "next/navigation";
import { MemberList } from "./member-list";
import { UserSettings } from "./user-settings";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const membership = await requireWorkspaceMembership(user.id, workspaceId);

  const [workspace, profile] = await Promise.all([
    getWorkspaceWithMembers(workspaceId),
    getUserProfile(user.id),
  ]);

  if (!workspace) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">설정</h1>

      {/* 개인 설정 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">개인 설정</h2>
        <UserSettings
          timezone={profile?.timezone ?? "Asia/Seoul"}
          notificationEnabled={profile?.notificationEnabled ?? true}
        />
      </div>

      {/* 멤버 관리 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          멤버 ({workspace.memberships.length}명)
        </h2>
        <MemberList
          workspaceId={workspaceId}
          members={workspace.memberships.map((m) => ({
            userId: m.userId,
            email: m.user.email,
            name: m.user.name,
            avatarUrl: m.user.avatarUrl,
            role: m.role,
            aliases: m.aliases,
            isActive: m.isActive,
          }))}
          currentUserId={user.id}
          currentUserRole={membership.role}
        />
      </div>
    </div>
  );
}
