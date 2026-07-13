'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bot, Zap, Plus, ArrowRight, AlertCircle, MessageSquare, Clock, Workflow } from 'lucide-react';
import Link from 'next/link';
import { useWorkspace } from '@/context/workspace-context';
import { StatCardSkeleton, ConversationListSkeleton } from '@/components/ui/skeleton-loaders';
import { apiFetch } from '@/lib/api-client';

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
        const res = await apiFetch(`${API_BASE}/workspaces/${activeWorkspace.id}/chat`);
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
      <div className="p-8 lg:p-12 max-w-5xl mx-auto w-full space-y-10">
        <div className="space-y-3">
          <div className="skeleton h-5 w-20 rounded-full" />
          <div className="skeleton h-10 w-80" />
          <div className="skeleton h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="p-8 lg:p-12 max-w-5xl mx-auto w-full">
        <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">No Workspace</h4>
            <p className="text-sm mt-1 text-amber-400/80">Create or select a workspace to get started.</p>
          </div>
        </div>
      </div>
    );
  }

  const connectedAppsCount = activeWorkspace.integrations?.length || 0;

  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto w-full space-y-12">
      
      {/* ── Header ── */}
      <div className="space-y-4">
        <span className="pill-badge">{greeting} 👋</span>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-[family-name:var(--font-sora)]">
          {activeWorkspace.name}
        </h1>
        <p className="text-muted-foreground text-base max-w-lg">
          Here&apos;s what&apos;s happening in your workspace.
        </p>
      </div>

      {/* ── Stats row — ove.chat bento style with border dividers ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-xl overflow-hidden bg-card/20 shadow-sm">
        
        {/* Connected Integrations */}
        <div className="p-6 lg:p-8 border-b sm:border-b sm:border-r lg:border-b-0 border-border hover:bg-white/[0.02] transition-colors duration-200">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-4">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Connected Apps
          </div>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold font-[family-name:var(--font-sora)] tracking-tight">{connectedAppsCount}</span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              connectedAppsCount > 0 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-neutral-800 text-muted-foreground'
            }`}>
              {connectedAppsCount > 0 ? 'Active' : 'Setup'}
            </span>
          </div>
        </div>

        {/* Workflows */}
        <Link href="/dashboard/workflows/history" className="p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-border hover:bg-white/[0.02] transition-colors duration-200 group block">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-4">
            <Workflow className="w-3.5 h-3.5 text-blue-400" />
            Workflows
          </div>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold font-[family-name:var(--font-sora)] tracking-tight">0</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-800 text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
              View <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </Link>
        
        {/* Conversations */}
        <div className="p-6 lg:p-8 border-b sm:border-b-0 sm:border-r border-border hover:bg-white/[0.02] transition-colors duration-200">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-4">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            Conversations
          </div>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold font-[family-name:var(--font-sora)] tracking-tight">{conversations.length}</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-800 text-muted-foreground">
              Total
            </span>
          </div>
        </div>

        {/* Quick CTA */}
        <Link href="/dashboard/chat" className="p-6 lg:p-8 hover:bg-white/[0.02] transition-colors duration-200 group flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-4">
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            Start AI Chat
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all duration-200 text-foreground">
            New Chat
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* ── Recent Conversations ── */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight font-[family-name:var(--font-sora)]">
            Recent conversations
          </h2>
          {conversations.length > 5 && (
            <Link href="/dashboard/chat" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              View all →
            </Link>
          )}
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          {loadingChats ? (
            <ConversationListSkeleton count={4} />
          ) : conversations.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No conversations yet.
              </p>
              <Link href="/dashboard/chat" className="text-sm font-medium text-foreground mt-3 inline-flex items-center gap-1.5 hover:gap-2.5 transition-all duration-200">
                Start one <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div>
              {conversations.slice(0, 5).map((conv, i) => {
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
                    className={`p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors duration-150 group ${
                      i < conversations.slice(0, 5).length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <div className="w-9 h-9 bg-neutral-900 border border-border rounded-lg flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title || 'Untitled Conversation'}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMsg}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formattedDate}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions — minimal list ── */}
      <div className="space-y-5">
        <h2 className="text-xl font-bold tracking-tight font-[family-name:var(--font-sora)]">
          Quick actions
        </h2>
        <div className="border border-border rounded-xl overflow-hidden">
          {[
            { href: '/dashboard/chat', icon: Bot, label: 'New Agent Chat', desc: 'Talk to your AI agents' },
            { href: '/dashboard/workflows/history', icon: Workflow, label: 'Workflows & Automation', desc: 'Automate tasks across integrations' },
            { href: '/dashboard/integrations', icon: Zap, label: 'Manage Integrations', desc: 'Connect apps & services' },
            { href: '/dashboard/agents', icon: Bot, label: 'Your Agents', desc: 'Configure AI workers' },
          ].map((item, i, arr) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors duration-150 group ${
                i < arr.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="w-9 h-9 bg-neutral-900 border border-border rounded-lg flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
