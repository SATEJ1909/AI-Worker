'use client';

import { Bot, Plus, MoreVertical, Search, Zap, Code, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Dummy Data
const AGENTS = [
  { id: '1', name: 'Support Assistant', role: 'Customer Success', status: 'Active', icon: Bot, workflows: 12, lastActive: '2 mins ago' },
  { id: '2', name: 'Code Reviewer', role: 'Engineering', status: 'Active', icon: Code, workflows: 4, lastActive: '1 hour ago' },
  { id: '3', name: 'Research Bot', role: 'Marketing', status: 'Paused', icon: FileText, workflows: 2, lastActive: '2 days ago' },
];

export default function AgentsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-sora)]">Your Agents</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage and monitor your AI workforce.</p>
        </div>
        <Link href="/dashboard/agents/create" className="bg-foreground text-background px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-foreground/5">
          <Plus className="w-4 h-4" />
          Create Agent
        </Link>
      </div>

      {/* ── Search & Filter ── */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search agents..." 
            className="w-full bg-secondary/30 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all duration-200 placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground text-xs">Status:</span>
          <select className="bg-secondary/30 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 appearance-none cursor-pointer">
            <option>All</option>
            <option>Active</option>
            <option>Paused</option>
          </select>
        </div>
      </div>

      {/* ── Agent Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {AGENTS.map((agent) => (
          <Link href={`/dashboard/agents/${agent.id}`} key={agent.id} className="block group">
            <div className="glass gradient-border rounded-xl p-6 hover:bg-white/[0.04] transition-all duration-300 h-full flex flex-col">
              <div className="flex justify-between items-start mb-5">
                <div className="w-12 h-12 bg-foreground/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <agent.icon className="w-6 h-6 text-foreground/60" />
                </div>
                <button 
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all duration-200" 
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className="text-base font-bold mb-1 group-hover:text-foreground transition-colors">{agent.name}</h3>
              <p className="text-sm text-muted-foreground">{agent.role}</p>
              
              <div className="mt-auto pt-5 border-t border-border flex items-center justify-between text-xs">
                <span className={`flex items-center gap-2 font-semibold ${agent.status === 'Active' ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                  <span className={`w-2 h-2 rounded-full ${agent.status === 'Active' ? 'bg-emerald-400 pulse-ring' : 'bg-muted-foreground/50'}`} />
                  {agent.status}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Zap className="w-3 h-3" /> {agent.workflows} workflows
                </span>
              </div>
            </div>
          </Link>
        ))}
        
        {/* ── Create New Agent Card ── */}
        <Link href="/dashboard/agents/create" className="block group">
          <div className="border border-dashed border-border rounded-xl p-6 hover:bg-white/[0.02] hover:border-foreground/20 transition-all duration-300 h-full flex flex-col items-center justify-center text-center min-h-[220px]">
            <div className="w-12 h-12 bg-foreground/5 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-6 h-6 text-foreground/40" />
            </div>
            <h3 className="text-base font-semibold mb-1">Create new agent</h3>
            <p className="text-sm text-muted-foreground">Add a new AI worker to your team</p>
          </div>
        </Link>
      </div>

    </div>
  );
}
