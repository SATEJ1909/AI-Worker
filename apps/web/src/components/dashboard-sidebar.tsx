'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { CreateWorkspaceModal } from './create-workspace-modal';
import { 
  LayoutDashboard, 
  Workflow, 
  Bot, 
  MessageSquare, 
  Plug, 
  Settings,
  LogOut,
  Plus
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeWorkspaceId');
    router.push('/sign-in');
  };

  return (
    <>
      <aside className="w-64 border-r border-border bg-card flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center shrink-0">
            <span className="text-background text-sm font-bold font-[family-name:var(--font-sora)]">T</span>
          </div>
          TaskMind
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        
        <div className="space-y-1">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Main Menu</h3>
          {navItems.map((item) => {
          // Exact match for overview, prefix match for others to keep active state on sub-pages
          const isActive = item.href === '/dashboard' 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
            
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-foreground text-background shadow-sm' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workspaces</h3>
            <button onClick={() => setIsCreateModalOpen(true)} className="p-1 hover:bg-secondary rounded-md text-muted-foreground transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {isLoading ? (
            <div className="h-9 mx-3 animate-pulse bg-secondary rounded-lg"></div>
          ) : (
            workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => setActiveWorkspaceId(ws.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeWorkspace?.id === ws.id 
                    ? 'bg-secondary text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
              >
                <div className={`w-2 h-2 shrink-0 rounded-full ${activeWorkspace?.id === ws.id ? 'bg-green-500' : 'bg-transparent'}`} />
                <span className="truncate">{ws.name}</span>
              </button>
            ))
          )}
        </div>
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
    <CreateWorkspaceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
}
