'use client';

import { useState } from 'react';
import { GitBranch, Plus, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useWorkspace } from '@/context/workspace-context';

const INTEGRATION_PROVIDERS = [
  {
    providerId: 'github',
    name: 'GitHub',
    description: 'Allow your agents to read repositories, create pull requests, and review code.',
    icon: GitBranch,
    available: true,
  },
  {
    providerId: 'slack',
    name: 'Slack',
    description: 'Monitor channels and send messages automatically.',
    available: false,
  },
  {
    providerId: 'notion',
    name: 'Notion',
    description: 'Read documentation and create new pages on the fly.',
    available: false,
  },
  {
    providerId: 'linear',
    name: 'Linear',
    description: 'Manage issues and update ticket statuses based on commits.',
    available: false,
  },
  {
    providerId: 'gmail',
    name: 'Gmail',
    description: 'Read, organize, and respond to emails automatically.',
    available: false,
  },
  {
    providerId: 'drive',
    name: 'Google Drive',
    description: 'Access documents, spreadsheets, and presentations.',
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
      <div className="p-8 max-w-6xl mx-auto w-full flex justify-center py-12">
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

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-1">Connect your tools to give your AI agents context for {activeWorkspace.name}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INTEGRATION_PROVIDERS.map((provider) => {
          const isConnected = activeWorkspace?.integrations?.some((i: any) => i.provider === provider.providerId);
          const isConnecting = connectingProvider === provider.providerId;
          const Icon = provider.icon;

          if (!provider.available) {
            return (
              <div key={provider.providerId} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-full opacity-60">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground font-bold font-[family-name:var(--font-sora)]">
                    {provider.name[0]}
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>

                <h3 className="text-lg font-bold mb-2 text-muted-foreground">{provider.name}</h3>
                <p className="text-sm text-muted-foreground mb-6 flex-1">
                  {provider.description}
                </p>

                <button disabled className="w-full bg-secondary/50 text-muted-foreground px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                  Request Access
                </button>
              </div>
            );
          }

          return (
            <div key={provider.providerId} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                  {Icon ? <Icon className="w-6 h-6 text-foreground" /> : <div className="text-foreground font-bold font-[family-name:var(--font-sora)]">{provider.name[0]}</div>}
                </div>
                {isConnected ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                ) : isConnecting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-foreground border-t-transparent animate-spin"></div>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                    Disconnected
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold mb-2">{provider.name}</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1">
                {provider.description}
              </p>

              {isConnected ? (
                <Link
                  href={`/dashboard/integrations/${provider.providerId}`}
                  className="w-full bg-secondary text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                >
                  Manage Integration
                </Link>
              ) : (
                <button
                  onClick={() => handleConnectProvider(provider.providerId)}
                  disabled={isConnecting}
                  className="w-full bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-80"
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
