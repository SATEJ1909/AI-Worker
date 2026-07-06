'use client';

import { useState } from 'react';
import { GitBranch, Plus, CheckCircle2, AlertCircle, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useWorkspace } from '@/context/workspace-context';
import { CardGridSkeleton, PageHeaderSkeleton } from '@/components/ui/skeleton-loaders';

const INTEGRATION_PROVIDERS = [
  {
    providerId: 'github',
    name: 'GitHub',
    description: 'Allow your agents to read repositories, create pull requests, and review code.',
    icon: GitBranch,
    color: 'text-white',
    bg: 'bg-white/10',
    available: true,
  },
  {
    providerId: 'slack',
    name: 'Slack',
    description: 'Monitor channels and send messages automatically.',
    color: 'text-[#E01E5A]',
    bg: 'bg-[#E01E5A]/10',
    available: false,
  },
  {
    providerId: 'notion',
    name: 'Notion',
    description: 'Read documentation and create new pages on the fly.',
    color: 'text-white',
    bg: 'bg-white/10',
    available: false,
  },
  {
    providerId: 'linear',
    name: 'Linear',
    description: 'Manage issues and update ticket statuses based on commits.',
    color: 'text-[#5E6AD2]',
    bg: 'bg-[#5E6AD2]/10',
    available: false,
  },
  {
    providerId: 'gmail',
    name: 'Gmail',
    description: 'Read, organize, and respond to emails automatically.',
    color: 'text-[#EA4335]',
    bg: 'bg-[#EA4335]/10',
    available: false,
  },
  {
    providerId: 'drive',
    name: 'Google Drive',
    description: 'Access documents, spreadsheets, and presentations.',
    color: 'text-[#4285F4]',
    bg: 'bg-[#4285F4]/10',
    available: false,
  },
];

const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function IntegrationsPage() {
  const { activeWorkspace, isLoading } = useWorkspace();
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  const handleConnectProvider = async (providerId: string) => {
    if (!activeWorkspace) return alert('Workspace not loaded yet. Please try again in a moment.');
    
    try {
      setConnectingProvider(providerId);
      const res = await fetch(`${API_HOST}/api/integrations/${providerId}/connect?workspaceId=${activeWorkspace.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || `Failed to connect to ${providerId}`);
        setConnectingProvider(null);
      }
    } catch (error) {
      console.error(error);
      alert(`An error occurred while connecting to ${providerId}`);
      setConnectingProvider(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
        <PageHeaderSkeleton />
        <CardGridSkeleton count={6} />
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

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-sora)]">Integrations</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Connect your tools to give your AI agents context for <span className="text-foreground font-medium">{activeWorkspace.name}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {INTEGRATION_PROVIDERS.map((provider) => {
          const isConnected = activeWorkspace?.integrations?.some((i: any) => i.provider === provider.providerId);
          const isConnecting = connectingProvider === provider.providerId;
          const Icon = provider.icon;

          if (!provider.available) {
            return (
              <div key={provider.providerId} className="glass gradient-border rounded-xl p-6 flex flex-col h-full opacity-50">
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 ${provider.bg} rounded-xl flex items-center justify-center font-bold font-[family-name:var(--font-sora)] ${provider.color}`}>
                    {provider.name[0]}
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full uppercase tracking-wider">
                    <Lock className="w-3 h-3" />
                    Soon
                  </span>
                </div>

                <h3 className="text-base font-bold mb-1.5 text-muted-foreground">{provider.name}</h3>
                <p className="text-sm text-muted-foreground/70 mb-6 flex-1 leading-relaxed">
                  {provider.description}
                </p>

                <button disabled className="w-full bg-secondary/50 text-muted-foreground/50 px-4 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed">
                  Coming Soon
                </button>
              </div>
            );
          }

          return (
            <div key={provider.providerId} className="glass gradient-border rounded-xl p-6 flex flex-col h-full group hover:bg-white/[0.04] transition-all duration-300">
              <div className="flex items-start justify-between mb-5">
                <div className={`w-12 h-12 ${provider.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  {Icon ? <Icon className={`w-6 h-6 ${provider.color}`} /> : <div className={`font-bold font-[family-name:var(--font-sora)] ${provider.color}`}>{provider.name[0]}</div>}
                </div>
                {isConnected ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                ) : isConnecting ? (
                  <div className="w-5 h-5 rounded-full border-2 border-foreground/60 border-t-transparent animate-spin" />
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Disconnected
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold mb-1.5">{provider.name}</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed">
                {provider.description}
              </p>

              {isConnected ? (
                <Link
                  href={`/dashboard/integrations/${provider.providerId}`}
                  className="w-full bg-secondary text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary/80 transition-all duration-200 flex items-center justify-center gap-2 group/btn"
                >
                  Manage Integration
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/btn:opacity-100 -translate-x-1 group-hover/btn:translate-x-0 transition-all duration-200" />
                </Link>
              ) : (
                <button
                  onClick={() => handleConnectProvider(provider.providerId)}
                  disabled={isConnecting}
                  className="w-full bg-foreground text-background px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-60 shadow-lg shadow-foreground/5"
                >
                  <Plus className="w-4 h-4" />
                  {isConnecting ? 'Connecting...' : `Connect ${provider.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
