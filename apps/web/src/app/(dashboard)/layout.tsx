import { DashboardSidebar } from '@/components/dashboard-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-[family-name:var(--font-inter)]">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {children}
      </main>
    </div>
  );
}
