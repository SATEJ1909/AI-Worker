'use client';

import { useState, useEffect } from 'react';
import { Github, Plus, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function IntegrationsPage() {
  const [githubStatus, setGithubStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');

  useEffect(() => {
    // Check GitHub connection status
    const checkStatus = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/integrations/github/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on auth mechanism
          }
        });
        if (res.ok) {
          const data = await res.json();
          setGithubStatus(data.connected ? 'connected' : 'disconnected');
        } else {
          setGithubStatus('disconnected');
        }
      } catch (error) {
        setGithubStatus('disconnected');
      }
    };

    checkStatus();
  }, []);

  const handleConnectGithub = async () => {
    if (!workspaceId) return alert('Workspace not loaded yet. Please try again in a moment.');
    
    try {
      const res = await fetch(`http://localhost:3000/api/integrations/github/connect?workspaceId=${workspaceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || 'Failed to connect to GitHub');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while connecting to GitHub');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-1">Connect your tools to give your AI agents context.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* GitHub Integration Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
              <Github className="w-6 h-6 text-foreground" />
            </div>
            {githubStatus === 'loading' ? (
              <div className="w-4 h-4 rounded-full border-2 border-foreground border-t-transparent animate-spin"></div>
            ) : githubStatus === 'connected' ? (
              <span className="flex items-center gap-1 text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                Disconnected
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold mb-2">GitHub</h3>
          <p className="text-sm text-muted-foreground mb-6 flex-1">
            Allow your agents to read repositories, create pull requests, and review code.
          </p>

          {githubStatus === 'connected' ? (
            <Link
              href="/dashboard/integrations/github"
              className="w-full bg-secondary text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
            >
              Manage Integration
            </Link>
          ) : (
            <button
              onClick={handleConnectGithub}
              disabled={githubStatus === 'loading'}
              className="w-full bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Connect GitHub
            </button>
          )}
        </div>

        {/* Coming Soon Cards */}
        {[
          { name: 'Slack', desc: 'Monitor channels and send messages automatically.' },
          { name: 'Notion', desc: 'Read documentation and create new pages on the fly.' },
          { name: 'Linear', desc: 'Manage issues and update ticket statuses based on commits.' }
        ].map((app) => (
          <div key={app.name} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-full opacity-60">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground font-bold font-[family-name:var(--font-sora)]">
                {app.name[0]}
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                Coming Soon
              </span>
            </div>

            <h3 className="text-lg font-bold mb-2 text-muted-foreground">{app.name}</h3>
            <p className="text-sm text-muted-foreground mb-6 flex-1">
              {app.desc}
            </p>

            <button disabled className="w-full bg-secondary/50 text-muted-foreground px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
              Request Access
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
