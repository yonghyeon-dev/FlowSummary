"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  workspaceId?: string;
  className?: string;
}

const NAV_ITEMS = [
  { label: "대시보드", path: "dashboard" },
  { label: "회의", path: "meetings" },
  { label: "내 할 일", path: "tasks" },
  { label: "설정", path: "settings" },
];

export function Sidebar({ workspaceId, className }: SidebarProps) {
  const pathname = usePathname();

  if (!workspaceId) {
    return null;
  }

  return (
    <aside className={cn("w-56 border-r p-4", className)}>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const href = `/workspaces/${workspaceId}/${item.path}`;
          const isActive = pathname.includes(`/${item.path}`);

          return (
            <Link
              key={item.path}
              href={href}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
