import { requireUser } from "@/modules/auth";
import { requireWorkspaceMembership } from "@/modules/workspace";
import { getActionItemsByUser } from "@/modules/action-item";
import { TaskList } from "./task-list";

export default async function MyTasksPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  await requireWorkspaceMembership(user.id, workspaceId);

  const items = await getActionItemsByUser(user.id, workspaceId);

  const serialized = items.map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    priority: item.priority,
    dueDate: item.dueDate ? item.dueDate.toISOString() : null,
    meeting: { id: item.meeting.id, title: item.meeting.title },
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">내 할 일</h1>
      <TaskList items={serialized} workspaceId={workspaceId} />
    </div>
  );
}
