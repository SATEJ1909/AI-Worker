import { Bot, Zap, Plus, ArrowRight, LayoutDashboard, Settings } from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverview() {
  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening with your agents.</p>
        </div>
        <Link href="/dashboard/agents/create" className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Agent
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium bg-green-500/10 text-green-500 px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              2 Active
            </span>
          </div>
          <h3 className="text-2xl font-bold">4</h3>
          <p className="text-sm text-muted-foreground mt-1">Total Agents</p>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium bg-secondary text-foreground px-2 py-1 rounded-full">
              Last 7 days
            </span>
          </div>
          <h3 className="text-2xl font-bold">128</h3>
          <p className="text-sm text-muted-foreground mt-1">Workflows Executed</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <h3 className="text-lg font-semibold mb-2">Connect more apps</h3>
          <p className="text-sm text-muted-foreground mb-4">Give your agents access to more context to improve their capabilities.</p>
          <Link href="/dashboard/integrations" className="text-sm font-medium flex items-center gap-1 text-primary hover:underline">
            Go to Integrations <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
          <div className="bg-card border border-border rounded-xl divide-y divide-border shadow-sm">
            
            <div className="p-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Research Agent completed: "Q3 Competitor Analysis"</p>
                <p className="text-xs text-muted-foreground">10 minutes ago</p>
              </div>
              <Link href="/dashboard/chat" className="text-xs font-medium px-3 py-1.5 bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors shrink-0">
                View
              </Link>
            </div>

            <div className="p-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Workflow triggered: "Sync Linear to Notion"</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
              <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded">Success</span>
            </div>

            <div className="p-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">GitHub Integration Connected</p>
                <p className="text-xs text-muted-foreground">Yesterday</p>
              </div>
              <Link href="/dashboard/integrations/github" className="text-xs font-medium px-3 py-1.5 bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors shrink-0">
                Manage
              </Link>
            </div>

          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            <Link href="/dashboard/chat" className="bg-card border border-border p-4 rounded-xl shadow-sm hover:border-foreground/50 transition-colors flex items-center gap-3">
              <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New Chat</p>
                <p className="text-xs text-muted-foreground">Talk to your agents</p>
              </div>
            </Link>
            <Link href="/dashboard/workflows/builder" className="bg-card border border-border p-4 rounded-xl shadow-sm hover:border-foreground/50 transition-colors flex items-center gap-3">
              <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New Workflow</p>
                <p className="text-xs text-muted-foreground">Automate a task</p>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
