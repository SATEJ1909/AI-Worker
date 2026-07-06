'use client';

import { useState, useEffect } from 'react';
import { User, Building, LogOut, Save, AlertCircle, CheckCircle2, Loader2, Trash2, Shield } from 'lucide-react';
import { useWorkspace } from '@/context/workspace-context';

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
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };

      const profileRes = await fetch(`${API_BASE}/user/profile`, { headers });

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
      const res = await fetch(`${API_BASE}/workspaces/${activeWorkspace.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) return;
    
    setIsDeleting(true);
    setMessage(null);

    try {
      await deleteWorkspace(activeWorkspace.id);
      setMessage({ type: 'success', text: 'Workspace deleted successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete workspace.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeWorkspaceId');
    window.location.href = '/sign-in';
  };

  if (loading || workspaceLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="space-y-2">
          <div className="skeleton h-8 w-32" />
          <div className="skeleton h-4 w-64" />
        </div>
        <div className="skeleton h-48 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-sora)]">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account and workspace preferences.</p>
      </div>

      {/* ── Toast message ── */}
      {message && (
        <div className={`p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-destructive/10 text-destructive border border-destructive/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />}
          <p className="font-medium text-sm mt-0.5">{message.text}</p>
        </div>
      )}

      <div className="space-y-6">
        
        {/* ── Profile Settings ── */}
        <div className="glass gradient-border rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <div className="w-9 h-9 bg-foreground/5 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-foreground/60" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Profile Information</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Synced from your auth provider</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Name</label>
              <input 
                type="text" 
                value={profile?.name || ''} 
                readOnly
                className="w-full max-w-md bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm opacity-70 cursor-not-allowed focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                value={profile?.email || ''} 
                readOnly
                className="w-full max-w-md bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm opacity-70 cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ── Workspace Settings ── */}
        {activeWorkspace && (
          <form onSubmit={handleUpdateWorkspace} className="glass gradient-border rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-3">
              <div className="w-9 h-9 bg-foreground/5 rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-foreground/60" />
              </div>
              <div>
                <h2 className="text-sm font-bold">Workspace Settings</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Configure your workspace</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Workspace Name</label>
                <input 
                  type="text" 
                  value={workspaceName} 
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full max-w-md bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Workspace ID</label>
                <input 
                  type="text" 
                  value={activeWorkspace.id} 
                  readOnly
                  className="w-full max-w-md bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-xs font-mono opacity-70 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-foreground text-background px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-foreground/5 disabled:opacity-60"
                >
                  {saving ? <div className="w-4 h-4 rounded-full border-2 border-background border-t-transparent animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── Danger Zone ── */}
        <div className="rounded-xl overflow-hidden border border-red-500/20">
          <div className="p-5 border-b border-red-500/20 bg-red-500/5 flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="text-sm font-bold text-red-400">Danger Zone</h2>
          </div>
          <div className="p-5 space-y-5 bg-red-500/[0.02]">
            
            {activeWorkspace && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold">Delete Workspace</h3>
                  <p className="text-sm text-muted-foreground mt-1">Permanently remove this workspace and all its data.</p>
                </div>
                <button 
                  onClick={handleDeleteWorkspace}
                  disabled={isDeleting}
                  className="shrink-0 bg-red-500/10 text-red-400 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait border border-red-500/20"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete Workspace
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold">Sign Out</h3>
                <p className="text-sm text-muted-foreground mt-1">Log out of your current session.</p>
              </div>
              <button 
                onClick={handleLogout}
                className="shrink-0 bg-secondary text-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary/80 transition-all duration-200 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
