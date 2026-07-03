'use client';

import { useState, useEffect } from 'react';
import { User, Building, LogOut, Save, AlertCircle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
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
      <div className="p-8 max-w-4xl mx-auto flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-4 border-foreground border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and workspace preferences.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-start gap-3 ${
          message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
          <p className="font-medium text-sm mt-0.5">{message.text}</p>
        </div>
      )}

      <div className="space-y-6">
        
        {/* Profile Settings */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-secondary/20">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <User className="w-5 h-5" /> Profile Information
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Name</label>
              <input 
                type="text" 
                value={profile?.name || ''} 
                readOnly
                className="w-full max-w-md bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm opacity-70 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email</label>
              <input 
                type="email" 
                value={profile?.email || ''} 
                readOnly
                className="w-full max-w-md bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm opacity-70 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-muted-foreground">Profile information is synced from your auth provider.</p>
          </div>
        </div>

        {/* Workspace Settings */}
        {activeWorkspace && (
          <form onSubmit={handleUpdateWorkspace} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-secondary/20">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Building className="w-5 h-5" /> Workspace Settings
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Workspace Name</label>
                <input 
                  type="text" 
                  value={workspaceName} 
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full max-w-md bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Workspace ID</label>
                <input 
                  type="text" 
                  value={activeWorkspace.id} 
                  readOnly
                  className="w-full max-w-md bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-mono text-xs opacity-70 cursor-not-allowed"
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center gap-2"
                >
                  {saving ? <div className="w-4 h-4 rounded-full border-2 border-background border-t-transparent animate-spin"></div> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Danger Zone */}
        <div className="bg-card border border-destructive/20 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-destructive/20 bg-destructive/5">
            <h2 className="text-lg font-bold text-destructive">Danger Zone</h2>
          </div>
          <div className="p-6 space-y-6">
            
            {activeWorkspace && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Delete Workspace</h3>
                  <p className="text-sm text-muted-foreground mt-1">Permanently remove this workspace and all its data. This action is irreversible.</p>
                </div>
                <button 
                  onClick={handleDeleteWorkspace}
                  disabled={isDeleting}
                  className="shrink-0 bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors flex items-center gap-2 disabled:opacity-80 disabled:cursor-wait"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete Workspace
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Sign Out</h3>
                <p className="text-sm text-muted-foreground mt-1">Log out of your current session on this device.</p>
              </div>
              <button 
                onClick={handleLogout}
                className="shrink-0 bg-secondary text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
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
