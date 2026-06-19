'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Play, Zap, Save, Check } from 'lucide-react';
import Link from 'next/link';

export default function WorkflowBuilderPage() {
  const [nodes, setNodes] = useState([
    { id: 1, type: 'trigger', title: 'GitHub Webhook', desc: 'When a new Pull Request is opened' },
    { id: 2, type: 'action', title: 'AI Code Review', desc: 'Code Reviewer Agent analyzes the diff' }
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 bg-secondary/10">
      
      {/* Header */}
      <div className="h-16 border-b border-border bg-background flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/workflows/history" className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <input 
              type="text" 
              defaultValue="PR Review Assistant" 
              className="font-bold text-lg bg-transparent border-none focus:outline-none focus:ring-0 p-0"
            />
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="text-sm font-medium px-4 py-2 hover:bg-secondary rounded-lg transition-colors flex items-center gap-2">
            <Play className="w-4 h-4" /> Test
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center gap-2 w-24 justify-center"
          >
            {saving ? <div className="w-4 h-4 rounded-full border-2 border-background border-t-transparent animate-spin"></div> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* Canvas Area (Mocked visual builder) */}
      <div className="flex-1 overflow-auto p-12 flex flex-col items-center">
        
        {nodes.map((node, index) => (
          <div key={node.id} className="flex flex-col items-center">
            
            <div className="w-80 bg-card border border-border shadow-md rounded-xl p-4 hover:border-foreground/40 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  {node.type === 'trigger' ? <Zap className="w-3 h-3 text-yellow-500" /> : <Play className="w-3 h-3 text-blue-500" />}
                  {node.type}
                </span>
              </div>
              <h3 className="font-bold">{node.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{node.desc}</p>
            </div>

            {index < nodes.length - 1 && (
              <div className="w-0.5 h-12 bg-border relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-border bg-background"></div>
              </div>
            )}
          </div>
        ))}

        <div className="w-0.5 h-12 bg-border border-dashed relative"></div>
        
        <button className="w-12 h-12 bg-background border border-border border-dashed rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground hover:bg-secondary transition-all shadow-sm">
          <Plus className="w-6 h-6" />
        </button>

      </div>
    </div>
  );
}
