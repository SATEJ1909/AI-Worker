'use client';

import { useState, useEffect } from 'react';
import { Github, ArrowLeft, RefreshCw, Trash2, FolderGit2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
}

export default function ConnectedGithubPage() {
  const [profile, setProfile] = useState<any>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGithubData();
  }, []);

  const fetchGithubData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust auth as needed
      };

      const [profileRes, reposRes] = await Promise.all([
        fetch('http://localhost:3000/api/integrations/github/profile', { headers }),
        fetch('http://localhost:3000/api/integrations/github/repos', { headers })
      ]);

      if (!profileRes.ok || !reposRes.ok) throw new Error('Failed to fetch GitHub data');

      const profileData = await profileRes.json();
      const reposData = await reposRes.json();

      setProfile(profileData.profile);
      setRepos(reposData.repos || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect GitHub? Your agents will lose access to all repositories.')) return;

    try {
      const res = await fetch('http://localhost:3000/api/integrations/github/disconnect', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        window.location.href = '/dashboard/integrations';
      } else {
        alert('Failed to disconnect');
      }
    } catch (err) {
      alert('Failed to disconnect');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex items-center gap-4">
        <Link href="/dashboard/integrations" className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Github className="w-8 h-8" /> GitHub Integration
          </h1>
          <p className="text-muted-foreground mt-1">Manage your connected GitHub account and repository access.</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold">Error loading data</h4>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-foreground border-t-transparent animate-spin"></div>
        </div>
      ) : profile ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Profile Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <img src={profile.avatar_url} alt="Profile" className="w-16 h-16 rounded-full bg-secondary" />
                <div>
                  <h3 className="font-bold text-lg">{profile.name || profile.login}</h3>
                  <a href={profile.html_url} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:underline">@{profile.login}</a>
                </div>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Public Repos: <span className="font-medium text-foreground">{profile.public_repos}</span></p>
                <p>Followers: <span className="font-medium text-foreground">{profile.followers}</span></p>
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
                        <a href={repo.html_url} target="_blank" rel="noreferrer" className="font-medium hover:underline flex items-center gap-2">
                          <FolderGit2 className="w-4 h-4 text-muted-foreground" />
                          {repo.full_name}
                        </a>
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
      ) : null}
    </div>
  );
}
