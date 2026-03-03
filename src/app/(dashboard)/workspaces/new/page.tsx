import { createWorkspace } from "@/modules/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>새 워크스페이스</CardTitle>
          <CardDescription>
            팀과 함께 회의를 관리할 워크스페이스를 만드세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-destructive mb-4">{error}</p>
          )}
          <form action={createWorkspace} className="flex flex-col gap-4">
            <div className="space-y-1">
              <Label htmlFor="name">워크스페이스 이름</Label>
              <Input
                id="name"
                name="name"
                placeholder="우리 팀"
                required
                autoFocus
              />
            </div>
            <Button type="submit">만들기</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
