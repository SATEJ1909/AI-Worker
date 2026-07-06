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
  Sparkles
} from 'lucide-react';
import { useWorkspace } from '@/context/workspace-context';

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Integrations', href: '/dashboard/integrations', icon: Plug },
  { name: 'Agents', href: '/dashboard/agents', icon: Bot },
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
    localStorage.removeItem('token');
    localStorage.removeItem('activeWorkspaceId');
    router.push('/sign-in');
  };

  return (
    <>
      <aside className={`${collapsed ? 'w-[68px]' : 'w-64'} border-r border-border bg-card/50 backdrop-blur-xl flex flex-col h-full shrink-0 transition-all duration-300 ease-out relative`}>
        
        {/* ── Brand header ── */}
        <div className={`h-16 flex items-center ${collapsed ? 'justify-center px-2' : 'px-5'} border-b border-border`}>
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-lg group">
            <div className="w-9 h-9 bg-gradient-to-br from-foreground to-foreground/80 rounded-xl flex items-center justify-center shrink-0 shadow-lg group-hover:shadow-foreground/10 transition-shadow">
              <Sparkles className="w-4.5 h-4.5 text-background" />
            </div>
            {!collapsed && (
              <span className="font-[family-name:var(--font-sora)] tracking-tight">
                TaskMind
              </span>
            )}
          </Link>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-6">
          
          <div className="space-y-1">
            {!collapsed && (
              <h3 className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">
                Menu
              </h3>
            )}
            {navItems.map((item) => {
              const isActive = item.href === '/dashboard' 
                ? pathname === item.href 
                : pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center gap-3 ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-foreground text-background shadow-md shadow-foreground/5' 
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-foreground rounded-r-full -ml-2.5" />
                  )}
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  {!collapsed && item.name}
                </Link>
              );
            })}
          </div>

          {/* ── Workspaces ── */}
          <div className="space-y-1">
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 mb-2`}>
              {!collapsed && (
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
                  Workspaces
                </h3>
              )}
              <button 
                onClick={() => setIsCreateModalOpen(true)} 
                title="New workspace"
                className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {isLoading ? (
              <div className={`${collapsed ? 'mx-1' : 'mx-3'} space-y-1.5`}>
                <div className="skeleton h-8 rounded-lg" />
                <div className="skeleton h-8 rounded-lg opacity-60" />
              </div>
            ) : (
              workspaces.map(ws => (
                <button
                  key={ws.id}
                  onClick={() => setActiveWorkspaceId(ws.id)}
                  title={collapsed ? ws.name : undefined}
                  className={`w-full flex items-center gap-2.5 ${collapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeWorkspace?.id === ws.id 
                      ? 'bg-secondary text-foreground' 
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
                >
                  <span className={`w-2 h-2 shrink-0 rounded-full transition-all duration-300 ${
                    activeWorkspace?.id === ws.id ? 'bg-emerald-400 pulse-ring' : 'bg-muted-foreground/30'
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
        <div className="border-t border-border p-2.5 space-y-1">
          <button 
            onClick={() => setCollapsed(c => !c)} 
            className={`flex items-center gap-3 ${collapsed ? 'justify-center px-2' : 'px-3'} py-2 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200`}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
          <button 
            onClick={handleLogout} 
            className={`flex items-center gap-3 ${collapsed ? 'justify-center px-2' : 'px-3'} py-2 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200`}
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
