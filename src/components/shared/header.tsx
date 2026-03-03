import { Separator } from "@/components/ui/separator";

export function Header() {
  return (
    <header className="flex h-14 items-center gap-4 border-b px-6">
      <h1 className="text-lg font-semibold">FlowSummary</h1>
      <Separator orientation="vertical" className="h-6" />
      {/* TODO: 워크스페이스 선택, 사용자 메뉴 */}
    </header>
  );
}
