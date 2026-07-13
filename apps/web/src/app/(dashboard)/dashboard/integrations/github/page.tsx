'use client';

import { useState, useEffect } from 'react';
import { GitBranch, ArrowLeft, RefreshCw, Trash2, FolderGit2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useWorkspace } from '@/context/workspace-context';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';

const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Repo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description: string | null;
  defaultBranch: string;
  updatedAt: string | null;
}

export default function ConnectedGithubPage() {
  const { activeWorkspace, isLoading: workspaceLoading, refreshWorkspaces } = useWorkspace();
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeWorkspace) {
      fetchGithubData();
    } else if (!workspaceLoading) {
      setLoading(false);
    }
  }, [activeWorkspace, workspaceLoading]);

  const fetchGithubData = async () => {
    if (!activeWorkspace) return;
    
    setLoading(true);
    setError(null);
    try {
      const [profileRes, reposRes] = await Promise.all([
        apiFetch(`${API_HOST}/api/integrations/github/profile?workspaceId=${activeWorkspace.id}`),
        apiFetch(`${API_HOST}/api/integrations/github/repos?workspaceId=${activeWorkspace.id}`)
      ]);

      if (!profileRes.ok || !reposRes.ok) {
         if (profileRes.status === 404 || reposRes.status === 404) {
           throw new Error('GitHub integration not found. Please connect first.');
         }
         throw new Error('Failed to fetch GitHub data');
      }

      const profileData = await profileRes.json();
      const reposData = await reposRes.json();

      setProfile(profileData.profile);
      setRepos(reposData.repos || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setProfile(null);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    if (!activeWorkspace) return;
    try {
      const res = await apiFetch(`${API_HOST}/api/integrations/github/connect?workspaceId=${activeWorkspace.id}`);
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || 'Failed to start GitHub reconnect');
      }
    } catch (err) {
      alert('Failed to start GitHub reconnect');
    }
  };

  const handleDisconnect = async () => {
    if (!activeWorkspace) return;
    if (!confirm('Are you sure you want to disconnect GitHub? Your agents will lose access to all repositories.')) return;

    try {
      const res = await apiFetch(`${API_HOST}/api/integrations/github/disconnect?workspaceId=${activeWorkspace.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await refreshWorkspaces();
        router.push('/dashboard/integrations');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to disconnect');
      }
    } catch (err) {
      alert('Failed to disconnect');
    }
  };

  if (workspaceLoading || loading) {
    return (
      <div className="flex justify-center py-12">
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
            <p className="text-sm mt-1">Please select a workspace.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex items-center gap-4">
        <Link href="/dashboard/integrations" className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <GitBranch className="w-8 h-8" /> GitHub Integration
          </h1>
          <p className="text-muted-foreground mt-1">Manage GitHub access for {activeWorkspace.name}.</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold">Error loading data</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleReconnect}
              className="flex-1 sm:flex-initial bg-foreground text-background px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reconnect GitHub
            </button>
            <button
              onClick={handleDisconnect}
              className="flex-1 sm:flex-initial bg-destructive/20 text-destructive px-4 py-2 rounded-lg text-sm font-semibold hover:bg-destructive/30 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Disconnect
            </button>
          </div>
        </div>
      )}

      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Profile Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <img src={profile.avatarUrl} alt="Profile" className="w-16 h-16 rounded-full bg-secondary" />
                <div>
                  <h3 className="font-bold text-lg">{profile.name || profile.login}</h3>
                  <a href={profile.htmlUrl} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:underline">@{profile.login}</a>
                </div>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                {profile.email && <p>Email: <span className="font-medium text-foreground">{profile.email}</span></p>}
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              className="w-full bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Disconnect GitHub
            </button>
          </div>

          {/* Repositories List */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Accessible Repositories</h2>
              <button
                onClick={fetchGithubData}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              {repos.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <FolderGit2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No repositories found.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {repos.map(repo => (
                    <div key={repo.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                      <div>
                        <a href={repo.htmlUrl} target="_blank" rel="noreferrer" className="font-medium hover:underline flex items-center gap-2">
                          <FolderGit2 className="w-4 h-4 text-muted-foreground" />
                          {repo.fullName}
                        </a>
                        {repo.description && <p className="text-xs text-muted-foreground mt-1 ml-6">{repo.description}</p>}
                      </div>
                      {repo.private ? (
                        <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">Private</span>
                      ) : (
                        <span className="text-xs border border-border px-2 py-1 rounded text-muted-foreground">Public</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {!profile && !error && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-semibold text-foreground">GitHub Integration Actions</h4>
            <p className="text-sm text-muted-foreground mt-1">If your connection is out of sync or tokens expired, reconnect or disconnect below.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleReconnect}
              className="flex-1 sm:flex-initial bg-foreground text-background px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reconnect GitHub
            </button>
            <button
              onClick={handleDisconnect}
              className="flex-1 sm:flex-initial bg-destructive/20 text-destructive px-4 py-2 rounded-lg text-sm font-semibold hover:bg-destructive/30 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Disconnect GitHub
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
