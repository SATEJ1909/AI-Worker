'use client';

import { Bot, Plus, Search, Code, FileText, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

const AGENTS = [
  { id: '1', name: 'Support Assistant', role: 'Customer Success', status: 'Active', icon: Bot, workflows: 12, lastActive: '2 mins ago' },
  { id: '2', name: 'Code Reviewer', role: 'Engineering', status: 'Active', icon: Code, workflows: 4, lastActive: '1 hour ago' },
  { id: '3', name: 'Research Bot', role: 'Marketing', status: 'Paused', icon: FileText, workflows: 2, lastActive: '2 days ago' },
];

export default function AgentsPage() {
  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto w-full space-y-10">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-4">
          <span className="pill-badge">Agents</span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-[family-name:var(--font-sora)]">
            Your agents.
          </h1>
          <p className="text-muted-foreground text-base max-w-lg">
            Manage and monitor your AI workforce.
          </p>
        </div>
        <Link href="/dashboard/agents/create" className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-colors duration-150 flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
          <Plus className="w-3.5 h-3.5" />
          Create agent
        </Link>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search agents..." 
          className="w-full bg-transparent border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/10 focus:border-foreground/20 transition-all duration-150 placeholder:text-muted-foreground/50"
        />
      </div>

      {/* ── Agent Directory ── */}
      <div className="border border-border rounded-xl overflow-hidden bg-card/40 shadow-sm">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-white/[0.015]">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Agent directory</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{AGENTS.length} agents configured</p>
          </div>
        </div>

        {/* Table Header Row for Perfect Alignment */}
        <div className="hidden sm:flex items-center px-6 py-2.5 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 bg-white/[0.01]">
          <div className="w-10 shrink-0 mr-4" />
          <div className="flex-1 min-w-0 pr-4">Agent Name</div>
          <div className="w-32 shrink-0">Workflows</div>
          <div className="w-24 shrink-0">Status</div>
          <div className="w-8 shrink-0 text-right" />
        </div>

        {/* List */}
        <div className="divide-y divide-border">
          {AGENTS.map((agent) => (
            <Link 
              key={agent.id} 
              href={`/dashboard/agents/${agent.id}`} 
              className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors duration-150 group"
            >
              <div className="w-10 h-10 bg-neutral-900/80 border border-border rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-white/20 transition-all duration-200 shadow-sm">
                <agent.icon className="w-5 h-5 text-foreground/80" />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-semibold text-foreground">{agent.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{agent.role}</p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 w-32 font-mono">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {agent.workflows} workflows
              </div>
              <div className="w-24 shrink-0 flex items-center text-xs">
                <span className={`font-medium flex items-center gap-1.5 ${
                  agent.status === 'Active' ? 'text-emerald-400' : 'text-muted-foreground'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    agent.status === 'Active' ? 'bg-emerald-400 pulse-ring' : 'bg-neutral-600'
                  }`} />
                  {agent.status}
                </span>
              </div>
              <div className="w-8 shrink-0 flex justify-end">
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-1 group-hover:translate-x-0" />
              </div>
            </Link>
          ))}

          {/* Create row */}
          <Link 
            href="/dashboard/agents/create" 
            className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors duration-150 group bg-white/[0.005]"
          >
            <div className="w-10 h-10 border border-dashed border-border rounded-xl flex items-center justify-center shrink-0 group-hover:border-white/30 transition-colors">
              <Plus className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Create new agent</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Add a new AI worker to your team</p>
            </div>
            <div className="w-8 shrink-0 flex justify-end">
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-1 group-hover:translate-x-0" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
