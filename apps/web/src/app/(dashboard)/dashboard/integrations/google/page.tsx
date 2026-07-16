'use client';

import { useState, useEffect, useRef } from 'react';
import { Mail, Calendar, ArrowLeft, RefreshCw, Trash2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { useWorkspace } from '@/context/workspace-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';

const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const GoogleIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

interface GoogleStatus {
  connected: boolean;
  accountEmail?: string | null;
  accountName?: string | null;
  avatarUrl?: string | null;
  connectedAt?: string;
}

const TOOL_CAPABILITIES = [
  { icon: Mail, label: 'gmail_list_emails', description: 'List recent inbox emails' },
  { icon: Mail, label: 'gmail_get_email', description: 'Read full email content' },
  { icon: Mail, label: 'gmail_search_emails', description: 'Search emails with Gmail syntax' },
  { icon: Mail, label: 'gmail_send_email', description: 'Compose and send emails' },
  { icon: Mail, label: 'gmail_reply_to_email', description: 'Reply to email threads' },
  { icon: Mail, label: 'gmail_create_draft', description: 'Save emails as drafts' },
  { icon: Mail, label: 'gmail_mark_read', description: 'Mark emails as read' },
  { icon: Calendar, label: 'calendar_list_events', description: 'List upcoming events' },
  { icon: Calendar, label: 'calendar_get_event', description: 'Get event details' },
  { icon: Calendar, label: 'calendar_create_event', description: 'Create calendar events' },
  { icon: Calendar, label: 'calendar_update_event', description: 'Update existing events' },
  { icon: Calendar, label: 'calendar_delete_event', description: 'Delete calendar events' },
  { icon: Calendar, label: 'calendar_search_events', description: 'Search events by keyword' },
];

export default function ConnectedGooglePage() {
  const { activeWorkspace, isLoading: workspaceLoading, refreshWorkspaces } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justConnected] = useState(() => searchParams.get('provider') === 'google');
  const hasRefreshed = useRef(false);

  useEffect(() => {
    if (activeWorkspace) {
      // Avoid fetching if we're just triggering a refresh
      if (justConnected && !hasRefreshed.current) {
        hasRefreshed.current = true;
        refreshWorkspaces();
        return; // wait for the refresh to finish before fetching status
      }
      fetchStatus();
    } else if (!workspaceLoading) {
      setLoading(false);
    }
  }, [activeWorkspace?.id, workspaceLoading]);

  const fetchStatus = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${API_HOST}/api/integrations/google/status?workspaceId=${activeWorkspace.id}`);
      if (!res.ok) throw new Error('Failed to fetch Google status');
      const data = await res.json();
      setStatus(data.status);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    if (!activeWorkspace) return;
    try {
      const res = await apiFetch(`${API_HOST}/api/integrations/google/connect?workspaceId=${activeWorkspace.id}`);
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || 'Failed to start Google reconnect');
      }
    } catch {
      alert('Failed to start Google reconnect');
    }
  };

  const handleDisconnect = async () => {
    if (!activeWorkspace) return;
    if (!confirm('Are you sure you want to disconnect Google? Your agents will lose access to Gmail and Calendar.')) return;
    try {
      const res = await apiFetch(`${API_HOST}/api/integrations/google/disconnect?workspaceId=${activeWorkspace.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await refreshWorkspaces();
        router.push('/dashboard/integrations');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to disconnect');
      }
    } catch {
      alert('Failed to disconnect');
    }
  };

  if (workspaceLoading || loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 rounded-full border-4 border-foreground border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="p-8 max-w-5xl mx-auto w-full">
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold">No Workspace</h4>
            <p className="text-sm mt-1">Please select a workspace.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/integrations" className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <GoogleIcon /> Google Integration
          </h1>
          <p className="text-muted-foreground mt-1">Gmail + Calendar access for {activeWorkspace.name}.</p>
        </div>
      </div>

      {/* ── Success banner ── */}
      {justConnected && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">Google connected successfully! Your agents can now access Gmail and Calendar.</p>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold">Error loading data</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={handleReconnect}
            className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reconnect
          </button>
        </div>
      )}

      {status?.connected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* ── Account Sidebar ── */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-4">
                {status.avatarUrl ? (
                  <img src={status.avatarUrl} alt="Profile" className="w-14 h-14 rounded-full ring-2 ring-border" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                    <GoogleIcon />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg">{status.accountName || 'Google Account'}</h3>
                  <p className="text-sm text-muted-foreground">{status.accountEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="font-medium">Connected</span>
              </div>

              {status.connectedAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Connected {new Date(status.connectedAt).toLocaleDateString()}
                </div>
              )}
            </div>

            <button
              onClick={handleReconnect}
              className="w-full bg-secondary text-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reconnect Google
            </button>

            <button
              onClick={handleDisconnect}
              className="w-full bg-destructive/10 text-destructive px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Disconnect Google
            </button>
          </div>

          {/* ── Available Tools ── */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Available Agent Tools</h2>
              <p className="text-sm text-muted-foreground">These tools are now active for your AI agents in this workspace.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOOL_CAPABILITIES.map((tool) => {
                const Icon = tool.icon;
                const isGmail = tool.label.startsWith('gmail_');
                return (
                  <div
                    key={tool.label}
                    className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 hover:border-white/20 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isGmail ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-mono font-semibold text-foreground/90">{tool.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!status?.connected && !error && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-semibold text-foreground">Google Not Connected</h4>
            <p className="text-sm text-muted-foreground mt-1">Connect your Google account to enable Gmail and Calendar tools.</p>
          </div>
          <button
            onClick={handleReconnect}
            className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Connect Google
          </button>
        </div>
      )}
    </div>
  );
}
