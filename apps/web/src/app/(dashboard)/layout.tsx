import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { WorkspaceProvider } from '@/context/workspace-context';
import { AuthGuard } from '@/components/auth-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <WorkspaceProvider>
        <div className="dashboard-dark flex h-screen overflow-hidden bg-background text-foreground font-[family-name:var(--font-inter)]">
          <DashboardSidebar />
          <main className="flex-1 overflow-y-auto relative flex flex-col ambient-glow">
            <div className="relative z-10 flex-1 flex flex-col">
              {children}
            </div>
          </main>
        </div>
      </WorkspaceProvider>
    </AuthGuard>
  );
}

