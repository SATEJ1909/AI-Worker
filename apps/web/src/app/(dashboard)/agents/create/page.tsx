'use client';

import { useState } from 'react';
import { ArrowLeft, Bot, Wand2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateAgentPage() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [instructions, setInstructions] = useState('');

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-4">
        <Link href="/dashboard/agents" className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Agent</h1>
          <p className="text-muted-foreground mt-1">Configure a new AI worker for your workspace.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-secondary/20 flex items-center gap-3">
          <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center border border-border">
            <Bot className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="font-bold">Agent Identity</h2>
            <p className="text-xs text-muted-foreground">Define who this agent is and what its purpose is.</p>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input 
                type="text" 
                placeholder="e.g. Code Reviewer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <input 
                type="text" 
                placeholder="e.g. Engineering"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">System Instructions</label>
              <button className="text-xs flex items-center gap-1 text-primary hover:underline">
                <Wand2 className="w-3 h-3" /> Auto-generate
              </button>
            </div>
            <textarea 
              placeholder="You are a helpful engineering assistant. Your job is to..."
              rows={5}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-y"
            ></textarea>
            <p className="text-xs text-muted-foreground">These instructions define the core behavior and boundaries of the agent.</p>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Link href="/dashboard/agents" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
              Cancel
            </Link>
            <Link href="/dashboard/agents" className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors">
              Create Agent
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
