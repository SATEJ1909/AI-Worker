'use client';

import { use, useState } from 'react';
import { ArrowLeft, Bot, Play, Pause, Settings2, Trash2, Activity } from 'lucide-react';
import Link from 'next/link';

export default function AgentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [status, setStatus] = useState('Active');

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/agents" className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Support Assistant</h1>
              <p className="text-sm text-muted-foreground">ID: {resolvedParams.id}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setStatus(status === 'Active' ? 'Paused' : 'Active')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border hover:bg-secondary transition-colors"
          >
            {status === 'Active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {status === 'Active' ? 'Pause Agent' : 'Resume Agent'}
          </button>
          <Link href="/dashboard/chat" className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors">
            Chat with Agent
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="md:col-span-2 space-y-8">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Settings2 className="w-5 h-5" /> Configuration
            </h2>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <p className="font-medium mt-1">Customer Success</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">System Prompt</label>
                <div className="mt-2 bg-secondary/50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap text-muted-foreground">
                  You are a Support Assistant. Your job is to read incoming tickets, search the internal documentation for answers, and draft replies. Do not send replies automatically unless confidence is &gt; 95%.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5" /> Recent Executions
            </h2>
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Drafted reply for Ticket #102{i}</p>
                    <p className="text-xs text-muted-foreground">{i * 15} minutes ago</p>
                  </div>
                  <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded">Success</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-bold mb-4">Status Overview</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Status</span>
                <span className={`font-medium ${status === 'Active' ? 'text-green-500' : 'text-yellow-500'}`}>{status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium">98.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Executions (24h)</span>
                <span className="font-medium">142</span>
              </div>
            </div>
          </div>

          <button className="w-full bg-destructive/10 text-destructive px-4 py-3 rounded-xl text-sm font-medium hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete Agent
          </button>
        </div>

      </div>

    </div>
  );
}
