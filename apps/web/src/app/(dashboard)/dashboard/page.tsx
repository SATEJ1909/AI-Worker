'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bot, Zap, Plus, ArrowRight, AlertCircle, MessageSquare, Activity, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useWorkspace } from '@/context/workspace-context';
import { StatCardSkeleton, ConversationListSkeleton } from '@/components/ui/skeleton-loaders';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1`;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

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
  }, [activeWorkspace?.id]);

  const greeting = useMemo(() => getGreeting(), []);

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
        <div className="space-y-2">
          <div className="skeleton h-8 w-64" />
          <div className="skeleton h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
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
      
      {/* ── Header ── */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{greeting} 👋</p>
          <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-sora)]">
            {activeWorkspace.name}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Here's what's happening in your workspace.
          </p>
        </div>
        <Link 
          href="/dashboard/chat" 
          className="bg-foreground text-background px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-foreground/5"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Link>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Connected Integrations */}
        <div className="glass gradient-border rounded-xl p-6 group hover:bg-white/[0.04] transition-all duration-300">
          <div className="flex justify-between items-start mb-5">
            <div className="w-11 h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {connectedAppsCount > 0 ? 'Active' : 'Setup'}
            </span>
          </div>
          <h3 className="text-3xl font-bold font-[family-name:var(--font-sora)]">{connectedAppsCount}</h3>
          <p className="text-sm text-muted-foreground mt-1">Connected Integrations</p>
        </div>
        
        {/* Chat Conversations */}
        <div className="glass gradient-border rounded-xl p-6 group hover:bg-white/[0.04] transition-all duration-300">
          <div className="flex justify-between items-start mb-5">
            <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider uppercase bg-secondary text-muted-foreground px-2.5 py-1 rounded-full">
              Total
            </span>
          </div>
          <h3 className="text-3xl font-bold font-[family-name:var(--font-sora)]">{conversations.length}</h3>
          <p className="text-sm text-muted-foreground mt-1">Chat Conversations</p>
        </div>

        {/* CTA Card */}
        <div className="glass gradient-border rounded-xl p-6 flex flex-col justify-center group hover:bg-white/[0.04] transition-all duration-300">
          <div className="w-11 h-11 bg-foreground/5 rounded-xl flex items-center justify-center text-foreground/60 mb-4 group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold mb-1">Connect more apps</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Give your AI agents access to GitHub and other tools.
          </p>
          <Link href="/dashboard/integrations" className="text-sm font-semibold flex items-center gap-1.5 text-foreground hover:gap-2.5 transition-all duration-200">
            Go to Integrations <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── Recent Activity & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Conversations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              Recent Conversations
            </h2>
            {conversations.length > 5 && (
              <Link href="/dashboard/chat" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                View all →
              </Link>
            )}
          </div>
          <div className="glass gradient-border rounded-xl overflow-hidden">
            
            {loadingChats ? (
              <ConversationListSkeleton count={4} />
            ) : conversations.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No conversations yet. Start one to see activity here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {conversations.slice(0, 5).map((conv) => {
                  const lastMsg = conv.messages?.[0]?.content || 'No messages yet';
                  const formattedDate = new Date(conv.updatedAt || conv.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <Link 
                      key={conv.id} 
                      href="/dashboard/chat" 
                      className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-all duration-200 group"
                    >
                      <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <Bot className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conv.title || 'Untitled Conversation'}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMsg}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formattedDate}
                        </span>
                        <span className="text-[10px] font-medium px-2.5 py-0.5 bg-secondary text-muted-foreground rounded-md group-hover:bg-foreground group-hover:text-background transition-all duration-200">
                          Open
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link href="/dashboard/chat" className="glass gradient-border block p-4 rounded-xl hover:bg-white/[0.04] transition-all duration-200 group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-foreground/5 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <Bot className="w-4 h-4 text-foreground/60" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">New Agent Chat</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Talk to your AI agents</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
              </div>
            </Link>
            <Link href="/dashboard/integrations" className="glass gradient-border block p-4 rounded-xl hover:bg-white/[0.04] transition-all duration-200 group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-foreground/5 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <Zap className="w-4 h-4 text-foreground/60" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Manage Integrations</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Connect apps & services</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
              </div>
            </Link>
            <Link href="/dashboard/agents" className="glass gradient-border block p-4 rounded-xl hover:bg-white/[0.04] transition-all duration-200 group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-foreground/5 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <Sparkles className="w-4 h-4 text-foreground/60" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Your Agents</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Configure AI workers</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
