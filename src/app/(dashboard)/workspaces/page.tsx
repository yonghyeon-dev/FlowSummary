import Link from "next/link";
import { requireUser } from "@/modules/auth";
import { getUserWorkspaces } from "@/modules/workspace";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function WorkspacesPage() {
  const user = await requireUser();
  const workspaces = await getUserWorkspaces(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">워크스페이스</h1>
        <Button asChild>
          <Link href="/workspaces/new">새 워크스페이스</Link>
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>워크스페이스가 없습니다</CardTitle>
            <CardDescription>
              새 워크스페이스를 만들어 팀과 함께 회의를 관리하세요
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3">
          {workspaces.map((ws) => (
            <Link key={ws.id} href={`/workspaces/${ws.id}/dashboard`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{ws.name}</CardTitle>
                  <CardDescription>
                    멤버 {ws._count.memberships}명
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
