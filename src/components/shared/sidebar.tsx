import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside className={cn("w-64 border-r bg-muted/40 p-4", className)}>
      <nav className="flex flex-col gap-2">
        {/* TODO: Phase 1에서 네비게이션 구현 */}
        <span className="text-sm text-muted-foreground">네비게이션</span>
      </nav>
    </aside>
  );
}
