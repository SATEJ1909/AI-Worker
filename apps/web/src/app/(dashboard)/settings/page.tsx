'use client';

import { useState, useEffect } from 'react';
import { User, Building, LogOut, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };

      const [profileRes, workspacesRes] = await Promise.all([
        fetch('http://localhost:3000/api/v1/user/profile', { headers }),
        fetch('http://localhost:3000/api/v1/workspaces', { headers })
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.user);
      }

      if (workspacesRes.ok) {
        const data = await workspacesRes.json();
        if (data.workspaces && data.workspaces.length > 0) {
          setWorkspace(data.workspaces[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load settings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`http://localhost:3000/api/v1/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: workspace.name })
      });

      if (res.ok) {
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/sign-in';
  };

  if (loading) {
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
        {workspace && (
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
                  value={workspace.name} 
                  onChange={(e) => setWorkspace({...workspace, name: e.target.value})}
                  className="w-full max-w-md bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Workspace ID</label>
                <input 
                  type="text" 
                  value={workspace.id} 
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
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4">Log out of your current session on this device.</p>
            <button 
              onClick={handleLogout}
              className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
