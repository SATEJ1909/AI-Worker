'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { CreateWorkspaceModal } from './create-workspace-modal';
import { 
  LayoutDashboard, 
  Bot, 
  MessageSquare, 
  Plug, 
  Settings,
  LogOut,
  Plus,
  ChevronsLeft,
  ChevronsRight,
  Workflow,
} from 'lucide-react';
import { useWorkspace } from '@/context/workspace-context';
import { clearTokens } from '@/lib/api-client';

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Integrations', href: '/dashboard/integrations', icon: Plug },
  { name: 'Agents', href: '/dashboard/agents', icon: Bot },
  { name: 'Workflows', href: '/dashboard/workflows/history', icon: Workflow },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { workspaces, activeWorkspace, setActiveWorkspaceId, isLoading } = useWorkspace();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    clearTokens();
    router.push('/sign-in');
  };

  return (
    <>
      <aside className={`${collapsed ? 'w-[60px]' : 'w-56'} border-r border-border bg-background flex flex-col h-full shrink-0 transition-all duration-300 ease-out`}>
        
        {/* ── Brand ── */}
        <div className={`h-14 flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} border-b border-border`}>
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-sm group">
            <div className="w-7 h-7 bg-foreground rounded-lg flex items-center justify-center shrink-0">
              <span className="text-background text-xs font-bold font-[family-name:var(--font-sora)]">T</span>
            </div>
            {!collapsed && (
              <span className="font-[family-name:var(--font-sora)] tracking-tight">
                TaskMind
              </span>
            )}
          </Link>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
          
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = item.href === '/dashboard' 
                ? pathname === item.href 
                : pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center gap-2.5 ${collapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                    isActive 
                      ? 'bg-foreground text-background' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && item.name}
                </Link>
              );
            })}
          </div>

          {/* ── Workspaces ── */}
          <div className="space-y-0.5">
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-2 mb-1.5`}>
              {!collapsed && (
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Workspaces
                </span>
              )}
              <button 
                onClick={() => setIsCreateModalOpen(true)} 
                title="New workspace"
                className="p-1 hover:bg-white/[0.06] rounded-md text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {isLoading ? (
              <div className={`${collapsed ? 'mx-1' : 'mx-2'} space-y-1`}>
                <div className="skeleton h-7 rounded-md" />
                <div className="skeleton h-7 rounded-md opacity-50" />
              </div>
            ) : (
              workspaces.map(ws => (
                <button
                  key={ws.id}
                  onClick={() => setActiveWorkspaceId(ws.id)}
                  title={collapsed ? ws.name : undefined}
                  className={`w-full flex items-center gap-2 ${collapsed ? 'justify-center px-2' : 'px-3'} py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                    activeWorkspace?.id === ws.id 
                      ? 'text-foreground bg-white/[0.04]' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 shrink-0 rounded-full ${
                    activeWorkspace?.id === ws.id ? 'bg-emerald-400' : 'bg-neutral-600'
                  }`} />
                  {!collapsed && (
                    <span className="truncate text-xs">{ws.name}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </nav>

        {/* ── Footer ── */}
        <div className="border-t border-border p-2 space-y-0.5">
          <button 
            onClick={() => setCollapsed(c => !c)} 
            className={`flex items-center gap-2.5 ${collapsed ? 'justify-center px-2' : 'px-3'} py-2 w-full rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors duration-150`}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
          <button 
            onClick={handleLogout} 
            className={`flex items-center gap-2.5 ${collapsed ? 'justify-center px-2' : 'px-3'} py-2 w-full rounded-lg text-[13px] font-medium text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-colors duration-150`}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="text-xs">Logout</span>}
          </button>
        </div>
      </aside>
      <CreateWorkspaceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
}
