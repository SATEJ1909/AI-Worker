'use client';

import { Bot, Plus, MoreVertical, Search, Zap, Code, FileText } from 'lucide-react';
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
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Agents</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor your AI workforce.</p>
        </div>
        <Link href="/dashboard/agents/create" className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Agent
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search agents..." 
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Status:</span>
          <select className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20">
            <option>All</option>
            <option>Active</option>
            <option>Paused</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AGENTS.map((agent) => (
          <Link href={`/dashboard/agents/${agent.id}`} key={agent.id} className="block group">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-foreground/50 transition-colors h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                  <agent.icon className="w-6 h-6 text-foreground" />
                </div>
                <button className="text-muted-foreground hover:text-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.preventDefault()}>
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">{agent.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{agent.role}</p>
              
              <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-xs">
                <span className={`flex items-center gap-1.5 font-medium ${agent.status === 'Active' ? 'text-green-500' : 'text-muted-foreground'}`}>
                  <span className={`w-2 h-2 rounded-full ${agent.status === 'Active' ? 'bg-green-500' : 'bg-muted-foreground'}`}></span>
                  {agent.status}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Zap className="w-3 h-3" /> {agent.workflows} workflows
                </span>
              </div>
            </div>
          </Link>
        ))}
        
        <Link href="/dashboard/agents/create" className="block">
          <div className="border-2 border-dashed border-border rounded-xl p-6 shadow-sm hover:bg-secondary/50 hover:border-foreground/30 transition-colors h-full flex flex-col items-center justify-center text-center min-h-[200px]">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">Create new agent</h3>
            <p className="text-sm text-muted-foreground">Add a new AI worker to your team</p>
          </div>
        </Link>
      </div>

    </div>
  );
}
