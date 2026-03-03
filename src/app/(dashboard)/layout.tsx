import { Header } from "@/components/shared/header";
import { Sidebar } from "@/components/shared/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar className="hidden md:block" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
