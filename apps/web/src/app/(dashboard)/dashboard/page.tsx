'use client';

import { useState, useEffect } from 'react';
import { Bot, Zap, Plus, ArrowRight, LayoutDashboard, Settings, AlertCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useWorkspace } from '@/context/workspace-context';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1`;

export default function DashboardOverview() {
  const { activeWorkspace, isLoading } = useWorkspace();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);

  useEffect(() => {
    if (!activeWorkspace) return;

    const fetchConversations = async () => {
      setLoadingChats(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/workspaces/${activeWorkspace.id}/chat`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.conversations) {
            setConversations(data.conversations);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard activity:', err);
      } finally {
        setLoadingChats(false);
      }
    };

    fetchConversations();
  }, [activeWorkspace]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-4 border-foreground border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold">No Workspace</h4>
            <p className="text-sm mt-1">Please create or select a workspace first.</p>
          </div>
        </div>
      </div>
    );
  }

  const connectedAppsCount = activeWorkspace.integrations?.length || 0;

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview: {activeWorkspace.name}</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening in your workspace.</p>
        </div>
        <Link href="/dashboard/chat" className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Chat Session
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
              {connectedAppsCount > 0 ? 'Active' : 'No Apps'}
            </span>
          </div>
          <h3 className="text-2xl font-bold">{connectedAppsCount}</h3>
          <p className="text-sm text-muted-foreground mt-1">Connected Integrations</p>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium bg-secondary text-foreground px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <h3 className="text-2xl font-bold">{conversations.length}</h3>
          <p className="text-sm text-muted-foreground mt-1">Chat Conversations</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <h3 className="text-lg font-semibold mb-2">Connect more apps</h3>
          <p className="text-sm text-muted-foreground mb-4">Give your AI agents access to GitHub and other tools to enhance their context.</p>
          <Link href="/dashboard/integrations" className="text-sm font-medium flex items-center gap-1 text-primary hover:underline">
            Go to Integrations <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold tracking-tight">Recent Conversations</h2>
          <div className="bg-card border border-border rounded-xl divide-y divide-border shadow-sm">
            
            {loadingChats ? (
              <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-foreground border-t-transparent animate-spin"></div>
                Loading activity...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No recent activity. Start a conversation with an agent to see it appear here!
              </div>
            ) : (
              conversations.slice(0, 5).map((conv) => {
                const lastMsg = conv.messages?.[0]?.content || 'No messages yet';
                const formattedDate = new Date(conv.updatedAt || conv.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={conv.id} className="p-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title || 'Untitled Conversation'}</p>
                      <p className="text-xs text-muted-foreground truncate">{lastMsg}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground">{formattedDate}</span>
                      <Link href="/dashboard/chat" className="text-xs font-medium px-3 py-1 bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors">
                        Open
                      </Link>
                    </div>
                  </div>
                );
              })
            )}

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
                <p className="text-sm font-medium">New Agent Chat</p>
                <p className="text-xs text-muted-foreground">Talk to your AI agents</p>
              </div>
            </Link>
            <Link href="/dashboard/integrations/github" className="bg-card border border-border p-4 rounded-xl shadow-sm hover:border-foreground/50 transition-colors flex items-center gap-3">
              <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Manage GitHub</p>
                <p className="text-xs text-muted-foreground">Configure repositories</p>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
