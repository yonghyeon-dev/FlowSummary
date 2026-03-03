import { requireUser } from "@/modules/auth";
import {
  getWorkspaceWithMembers,
  requireWorkspaceMembership,
} from "@/modules/workspace";
import { notFound } from "next/navigation";
import { MemberList } from "./member-list";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const membership = await requireWorkspaceMembership(user.id, workspaceId);
  const workspace = await getWorkspaceWithMembers(workspaceId);

  if (!workspace) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">설정</h1>

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
          }))}
          currentUserId={user.id}
          currentUserRole={membership.role}
        />
      </div>
    </div>
  );
}
