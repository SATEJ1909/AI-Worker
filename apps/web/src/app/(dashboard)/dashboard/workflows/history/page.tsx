'use client';

import { useState, useEffect } from 'react';
import { Workflow, Plus, Play, MoreHorizontal, ArrowRight, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1`;

export default function WorkflowHistoryPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const getWorkspaceId = async () => {
    const wsRes = await apiFetch(`${API_BASE}/workspaces`);
    if (!wsRes.ok) throw new Error('Failed to fetch workspaces');
    const wsData = await wsRes.json();
    return wsData.workspaces?.[0]?.id;
  };

  const fetchWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      const workspaceId = await getWorkspaceId();
      if (!workspaceId) throw new Error('No workspace found');

      const res = await apiFetch(`${API_BASE}/workflows?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error('Failed to fetch workflows');
      
      const data = await res.json();
      setWorkflows(data.workflows || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      const res = await apiFetch(`${API_BASE}/workflows/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchWorkflows();
      } else {
        alert('Failed to delete workflow');
      }
    } catch (err) {
      alert('Failed to delete workflow');
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground mt-1">Automate your tasks across all connected integrations.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchWorkflows} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link href="/dashboard/workflows/builder" className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Workflow
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-foreground border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-secondary/50 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Workflow Name</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Trigger</th>
                <th className="px-6 py-4 font-medium">Last Run</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workflows.map((wf) => (
                <tr key={wf.id} className="hover:bg-secondary/20 transition-colors group">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center">
                      <Workflow className="w-4 h-4 text-foreground" />
                    </div>
                    {wf.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 font-medium ${wf.status === 'active' ? 'text-green-500' : 'text-muted-foreground'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${wf.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground'}`}></span>
                      {wf.status.charAt(0).toUpperCase() + wf.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {wf.trigger ? (typeof wf.trigger === 'string' ? wf.trigger : wf.trigger.type) : 'None'}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {wf.lastRun ? new Date(wf.lastRun).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
                      <Play className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(wf.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {!loading && workflows.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <Workflow className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No workflows created yet.</p>
          </div>
        )}
      </div>

    </div>
  );
}
