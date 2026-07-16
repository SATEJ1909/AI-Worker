'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, AlertCircle, Lock, ExternalLink, Trash2 } from 'lucide-react';
import { useWorkspace } from '@/context/workspace-context';
import { apiFetch } from '@/lib/api-client';

// Brand icon helpers
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className ?? "w-5 h-5"} fill="currentColor" viewBox="0 0 24 24" style={{ color: 'inherit' }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const SlackIcon = ({ className }: { className?: string }) => (
  <svg className={className ?? "w-5 h-5"} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#E01E5A' }}>
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
  </svg>
);

const NotionIcon = ({ className }: { className?: string }) => (
  <svg className={className ?? "w-5 h-5"} viewBox="0 0 24 24" fill="currentColor" style={{ color: 'inherit' }}>
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.82 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.98-.467.98-1.167V6.261c0-.56-.233-.793-.887-.747L5.812 6.448c-.56.047-.56.28-.56.84zm3.314 11.897c-.42.047-.513-.187-.513-.653V8.082c0-.466.187-.653.607-.688l1.353-.093c.42-.047.56.186.56.56v10.126c0 .466-.187.653-.607.688l-1.4.093zm9.148-.56V8.595c0-.42.187-.607.56-.654l1.354-.093c.42-.047.56.187.56.607v10.313c0 .467-.187.653-.607.688l-1.354.093c-.42.047-.513-.186-.513-.653zm-5.74-.327l-2.007.14V8.409l2.007-.14v9.893zm2.567-.187c-.42.047-.56-.187-.56-.607V8.548c0-.466.187-.653.607-.688l1.4-.093c.42-.047.56.187.56.607v10.22c0 .467-.187.653-.607.688l-1.407.093z"/>
  </svg>
);

const LinearIcon = ({ className }: { className?: string }) => (
  <svg className={className ?? "w-5 h-5"} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#5E6AD2' }}>
    <path d="M2.992 12.183a9.19 9.19 0 0 1 18.016 0H2.992zM12 2.8a9.2 9.2 0 0 0-9.192 8.983h18.384A9.2 9.2 0 0 0 12 2.8zM2.808 12.8a9.2 9.2 0 0 0 18.384 0H2.808zM12 21.2a9.2 9.2 0 0 1-9.192-8.983h18.384A9.2 9.2 0 0 1 12 21.2z" />
  </svg>
);

const GmailIcon = ({ className }: { className?: string }) => (
  <svg className={className ?? "w-5 h-5"} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#EA4335' }}>
    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.348l8.073-5.855C21.69 2.28 24 3.434 24 5.457z"/>
  </svg>
);

const GoogleDriveIcon = ({ className }: { className?: string }) => (
  <svg className={className ?? "w-5 h-5"} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#34A853' }}>
    <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5-3.42-6zm3.87 0l6.55 11.5 3.43-6L15.01 3.5h-3.43zM8.01 16.5l-3.43 6h13.12l3.43-6H8.01z"/>
  </svg>
);

const VercelIcon = ({ className }: { className?: string }) => (
  <svg className={className ?? "w-5 h-5"} viewBox="0 0 24 24" fill="currentColor" style={{ color: 'inherit' }}>
    <path d="M24 22.525H0l12-21.05 12 21.05z"/>
  </svg>
);

const INTEGRATION_PROVIDERS = [
  {
    providerId: 'github',
    name: 'GitHub',
    description: 'Search repos, create PRs, and review code',
    authType: 'OAuth',
    icon: GitHubIcon,
    available: true,
  },
  {
    providerId: 'slack',
    name: 'Slack',
    description: 'Catch up on channels, post messages, and dig through history',
    authType: 'OAuth',
    icon: SlackIcon,
    available: false,
  },
  {
    providerId: 'notion',
    name: 'Notion',
    description: 'Turn notes, databases, and docs into operating memory',
    authType: 'OAuth',
    icon: NotionIcon,
    available: false,
  },
  {
    providerId: 'linear',
    name: 'Linear',
    description: 'Manage issues, update sprint cycles, and track project progress',
    authType: 'OAuth',
    icon: LinearIcon,
    available: false,
  },
  {
    providerId: 'google',
    name: 'Google (Gmail + Calendar)',
    description: 'Read & send emails, search threads, create and manage calendar events',
    authType: 'OAuth',
    icon: GmailIcon,
    available: true,
  },
  {
    providerId: 'vercel',
    name: 'Vercel',
    description: 'Inspect deployment logs, trigger builds, and check preview domains',
    authType: 'API Token',
    icon: VercelIcon,
    available: false,
  },
];

const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function IntegrationsPage() {
  const router = useRouter();
  const { activeWorkspace, isLoading, refreshWorkspaces } = useWorkspace();
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  const handleDisconnectProvider = async (providerId: string) => {
    if (!activeWorkspace) return;
    if (!confirm(`Are you sure you want to disconnect ${providerId}?`)) return;

    try {
      const res = await apiFetch(`${API_HOST}/api/integrations/${providerId}/disconnect?workspaceId=${activeWorkspace.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await refreshWorkspaces();
      } else {
        const data = await res.json();
        alert(data.message || `Failed to disconnect ${providerId}`);
      }
    } catch (error) {
      console.error(error);
      alert(`Failed to disconnect ${providerId}`);
    }
  };

  const handleConnectProvider = async (providerId: string) => {
    if (!activeWorkspace) return alert('Workspace not loaded yet.');
    
    try {
      setConnectingProvider(providerId);
      const res = await apiFetch(`${API_HOST}/api/integrations/${providerId}/connect?workspaceId=${activeWorkspace.id}`);
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
      <div className="p-8 lg:p-12 max-w-5xl mx-auto w-full space-y-10">
        <div className="space-y-3">
          <div className="skeleton h-5 w-24 rounded-full" />
          <div className="skeleton h-10 w-72" />
          <div className="skeleton h-4 w-96" />
        </div>
        <div className="border border-border rounded-xl overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`p-5 flex items-center gap-4 ${i < 5 ? 'border-b border-border' : ''}`}>
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-3 w-48" />
              </div>
              <div className="skeleton h-8 w-20 rounded-lg" />
            </div>
          ))}
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
            <p className="text-sm mt-1 text-amber-400/80">Create or select a workspace first.</p>
          </div>
        </div>
      </div>
    );
  }

  const connectedCount = activeWorkspace?.integrations?.length || 0;

  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto w-full space-y-10">
      
      {/* ── Header ── */}
      <div className="space-y-4">
        <span className="pill-badge">Connections</span>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-[family-name:var(--font-sora)]">
          Connect your sources.
        </h1>
        <p className="text-muted-foreground text-base max-w-lg">
          A clean directory for apps your AI agents can read, search, and act on.
        </p>
      </div>

      {/* ── Warning banner if no connections ── */}
      {connectedCount === 0 && (
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-5 py-3 text-sm text-amber-400/90">
          No integrations connected yet. Connect a source to give your agents context.
        </div>
      )}

      {/* ── Connection Directory ── */}
      <div className="space-y-4">
        <div className="border border-border rounded-xl overflow-hidden bg-card/40 shadow-sm">
          
          {/* Directory header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-white/[0.015]">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Connection directory</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Statuses reflect your workspace&apos;s connected integrations.
              </p>
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-md border border-border/50">
              {connectedCount} of {INTEGRATION_PROVIDERS.length} connected
            </span>
          </div>

          {/* Table Header Row for Perfect Alignment */}
          <div className="hidden sm:flex items-center px-6 py-2.5 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 bg-white/[0.01]">
            <div className="w-10 shrink-0 mr-4" />
            <div className="flex-1 min-w-0 pr-4">Provider</div>
            <div className="w-28 shrink-0">Auth Type</div>
            <div className="w-28 shrink-0">Status</div>
            <div className="w-24 shrink-0 text-right">Action</div>
          </div>

          {/* List */}
          <div className="divide-y divide-border">
            {INTEGRATION_PROVIDERS.map((provider) => {
              const isConnected = activeWorkspace?.integrations?.some((int: { provider: string }) => int.provider === provider.providerId);
              const isConnecting = connectingProvider === provider.providerId;
              const Icon = provider.icon;

              return (
                <div 
                  key={provider.providerId} 
                  className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors duration-150 group"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 bg-neutral-900/80 border border-border rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-white/20 transition-all duration-200 shadow-sm">
                    {Icon 
                      ? <Icon className="w-5 h-5" /> 
                      : <span className="text-sm font-bold text-foreground/70 font-[family-name:var(--font-sora)]">{provider.name[0]}</span>
                    }
                  </div>

                  {/* Name + Description */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{provider.name}</p>
                      {!provider.available && (
                        <span className="text-[10px] font-medium bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded border border-white/5">Soon</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{provider.description}</p>
                  </div>

                  {/* Auth type */}
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 w-28 font-mono">
                    <svg className="w-3 h-3 text-muted-foreground/60 shrink-0" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 6h4" stroke="currentColor" strokeWidth="1.2"/></svg>
                    {provider.authType}
                  </div>

                  {/* Status */}
                  <div className="hidden md:flex items-center text-xs shrink-0 w-28">
                    {!provider.available ? (
                      <span className="text-muted-foreground/50 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                        Coming soon
                      </span>
                    ) : isConnected ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-ring" />
                        Connected
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                        Disconnected
                      </span>
                    )}
                  </div>

                  {/* Action */}
                  <div className="w-24 shrink-0 flex justify-end">
                    {!provider.available ? (
                      <span className="text-xs text-muted-foreground/40 font-medium flex items-center gap-1 py-1.5 px-3 rounded-lg border border-transparent">
                        <Lock className="w-3 h-3" />
                        Locked
                      </span>
                    ) : isConnected ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => router.push(`/dashboard/integrations/${provider.providerId}`)}
                          className="text-xs font-semibold text-foreground flex items-center gap-1 py-1.5 px-2.5 rounded-lg border border-border hover:bg-white/[0.04] transition-all duration-150"
                        >
                          Manage <ExternalLink className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDisconnectProvider(provider.providerId)}
                          title="Disconnect integration"
                          className="p-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnectProvider(provider.providerId)}
                        disabled={isConnecting}
                        className="text-xs font-semibold text-background bg-foreground hover:bg-foreground/90 py-1.5 px-3 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5 shadow-sm"
                      >
                        {isConnecting ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-background border-t-transparent animate-spin" />
                        ) : (
                          <>Connect <Plus className="w-3.5 h-3.5" /></>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
