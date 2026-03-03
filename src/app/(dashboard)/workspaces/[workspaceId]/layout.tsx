import { Sidebar } from "@/components/shared/sidebar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return (
    <div className="flex flex-1">
      <Sidebar workspaceId={workspaceId} className="hidden md:block" />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
