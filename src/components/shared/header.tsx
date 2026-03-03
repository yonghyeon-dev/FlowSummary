import Link from "next/link";
import { getUser } from "@/modules/auth";
import { logout } from "@/modules/auth";
import { Button } from "@/components/ui/button";

export async function Header() {
  const user = await getUser();

  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <Link href="/workspaces" className="text-lg font-semibold">
        FlowSummary
      </Link>
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit">
              로그아웃
            </Button>
          </form>
        </div>
      )}
    </header>
  );
}
