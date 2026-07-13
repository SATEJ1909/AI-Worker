'use client';

import { useState, useEffect } from 'react';
import { LogOut, Save, AlertCircle, CheckCircle2, Trash2, Loader2 } from 'lucide-react';
import { useWorkspace } from '@/context/workspace-context';
import { apiFetch, clearTokens } from '@/lib/api-client';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1`;

export default function SettingsPage() {
  const { activeWorkspace, refreshWorkspaces, isLoading: workspaceLoading, deleteWorkspace } = useWorkspace();
  const [profile, setProfile] = useState<any>(null);
  const [workspaceName, setWorkspaceName] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (activeWorkspace) {
      setWorkspaceName(activeWorkspace.name);
    }
  }, [activeWorkspace]);

  const fetchProfileData = async () => {
    try {
      const profileRes = await apiFetch(`${API_BASE}/user/profile`);
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.user);
      }
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await apiFetch(`${API_BASE}/workspaces/${activeWorkspace.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: workspaceName })
      });

      if (res.ok) {
        await refreshWorkspaces();
        setMessage({ type: 'success', text: 'Workspace updated successfully.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update workspace.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace) return;
    if (!confirm('Are you sure you want to delete this workspace? This cannot be undone.')) return;
    
    setIsDeleting(true);
    setMessage(null);

    try {
      await deleteWorkspace(activeWorkspace.id);
      setMessage({ type: 'success', text: 'Workspace deleted.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete workspace.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    window.location.href = '/sign-in';
  };

  if (loading || workspaceLoading) {
    return (
      <div className="p-8 lg:p-12 max-w-4xl mx-auto w-full space-y-8">
        <div className="space-y-3">
          <div className="skeleton h-5 w-20 rounded-full" />
          <div className="skeleton h-10 w-48" />
        </div>
        <div className="skeleton h-44 rounded-xl" />
        <div className="skeleton h-56 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 max-w-4xl mx-auto w-full space-y-10">
      
      <div className="space-y-4">
        <span className="pill-badge">Settings</span>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-[family-name:var(--font-sora)]">
          Settings
        </h1>
        <p className="text-muted-foreground text-base">
          Manage your account and workspace preferences.
        </p>
      </div>

      {/* ── Toast message ── */}
      {message && (
        <div className={`px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
            : 'bg-red-500/10 text-red-400 border border-red-500/15'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* ── Profile ── */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Profile</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Synced from your auth provider</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Name</label>
            <input 
              type="text" 
              value={profile?.name || ''} 
              readOnly
              className="w-full max-w-sm bg-neutral-900 border border-border rounded-lg px-3 py-2 text-sm opacity-60 cursor-not-allowed focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
            <input 
              type="email" 
              value={profile?.email || ''} 
              readOnly
              className="w-full max-w-sm bg-neutral-900 border border-border rounded-lg px-3 py-2 text-sm opacity-60 cursor-not-allowed focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Workspace ── */}
      {activeWorkspace && (
        <form onSubmit={handleUpdateWorkspace} className="border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Workspace</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Configure your workspace</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Workspace Name</label>
              <input 
                type="text" 
                value={workspaceName} 
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full max-w-sm bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/10 focus:border-foreground/20 transition-all duration-150"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Workspace ID</label>
              <input 
                type="text" 
                value={activeWorkspace.id} 
                readOnly
                className="w-full max-w-sm bg-neutral-900 border border-border rounded-lg px-3 py-2 text-xs font-mono opacity-50 cursor-not-allowed focus:outline-none"
              />
            </div>
            <button 
              type="submit" 
              disabled={saving}
              className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-colors duration-150 flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save changes
            </button>
          </div>
        </form>
      )}

      {/* ── Danger Zone ── */}
      <div className="border border-red-500/15 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-red-500/15 bg-red-500/[0.03]">
          <h2 className="text-sm font-semibold text-red-400">Danger zone</h2>
        </div>
        <div className="p-5 space-y-5">
          {activeWorkspace && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
              <div>
                <p className="text-sm font-medium">Delete workspace</p>
                <p className="text-xs text-muted-foreground mt-0.5">Permanently remove this workspace and all its data.</p>
              </div>
              <button 
                onClick={handleDeleteWorkspace}
                disabled={isDeleting}
                className="shrink-0 text-xs font-semibold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors duration-150 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Delete
              </button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-muted-foreground mt-0.5">Log out of your current session.</p>
            </div>
            <button 
              onClick={handleLogout}
              className="shrink-0 text-xs font-semibold text-muted-foreground border border-border hover:bg-white/[0.04] px-4 py-2 rounded-lg transition-colors duration-150 flex items-center gap-1.5"
            >
              <LogOut className="w-3 h-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
