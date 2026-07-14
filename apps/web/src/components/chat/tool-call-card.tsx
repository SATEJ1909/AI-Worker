'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, Wrench, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { ToolCallEntry } from '@/hooks/use-chat';

interface ToolCallCardProps {
  tool: ToolCallEntry;
}

const statusConfig = {
  running: {
    label: 'Running',
    color: 'text-amber-400',
    borderColor: 'border-amber-400/20',
    bg: 'bg-amber-400/[0.04]',
    badgeBg: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />,
  },
  success: {
    label: 'Done',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    bg: 'bg-emerald-500/[0.03]',
    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
  },
  error: {
    label: 'Failed',
    color: 'text-red-400',
    borderColor: 'border-red-500/20',
    bg: 'bg-red-500/[0.04]',
    badgeBg: 'bg-red-500/10 text-red-300 border-red-500/20',
    icon: <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />,
  },
} as const;

function formatToolName(name: string) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function safeJson(val: unknown): string {
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

function getBriefSummary(toolName: string, data?: unknown): string | null {
  if (!data) return null;
  if (Array.isArray(data)) {
    return `Returned ${data.length} item${data.length === 1 ? '' : 's'}`;
  }
  if (typeof data === 'object' && data !== null) {
    if ('content' in data && typeof (data as any).content === 'string') {
      const lines = (data as any).content.split('\n').length;
      return `Read file (${lines} line${lines === 1 ? '' : 's'})`;
    }
    const keys = Object.keys(data);
    if (keys.length > 0) {
      return `Returned object (${keys.length} propert${keys.length === 1 ? 'y' : 'ies'})`;
    }
  }
  return null;
}

export function ToolCallCard({ tool }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const cfg = statusConfig[tool.status] || statusConfig.running;

  const hasInput = Object.keys(tool.input ?? {}).length > 0;
  const hasOutput = tool.result !== undefined;
  const summary = tool.result?.success ? getBriefSummary(tool.toolName, tool.result.data) : null;

  const handleCopy = (text: string, type: 'input' | 'output') => {
    navigator.clipboard.writeText(text);
    if (type === 'input') {
      setCopiedInput(true);
      setTimeout(() => setCopiedInput(false), 2000);
    } else {
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    }
  };

  return (
    <div className={`rounded-xl border ${cfg.borderColor} ${cfg.bg} text-xs font-mono overflow-hidden transition-all duration-200 my-1 shadow-sm backdrop-blur-sm`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-white/[0.03] transition-colors group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {cfg.icon}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold truncate text-foreground/90 group-hover:text-foreground">
              {formatToolName(tool.toolName)}
            </span>
            {summary && (
              <span className="hidden sm:inline-block text-[11px] font-sans text-muted-foreground truncate border-l border-white/10 pl-2 opacity-80">
                {summary}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.badgeBg}`}>
            {cfg.label}
          </span>
          {(hasInput || hasOutput) && (
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-white/5 divide-y divide-white/5 bg-black/20 text-[11px]">
          {hasInput && (
            <div className="p-3 relative group/box">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-widest font-sans font-semibold text-muted-foreground/70">
                  Input Arguments
                </span>
                <button
                  onClick={() => handleCopy(safeJson(tool.input), 'input')}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {copiedInput ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedInput ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="leading-relaxed text-foreground/80 overflow-x-auto whitespace-pre-wrap break-all bg-black/30 p-2.5 rounded-lg border border-white/5 max-h-60 overflow-y-auto">
                {safeJson(tool.input)}
              </pre>
            </div>
          )}

          {hasOutput && (
            <div className="p-3 relative group/box">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-widest font-sans font-semibold text-muted-foreground/70">
                  {tool.result?.success ? 'Execution Result' : 'Error Details'}
                </span>
                <button
                  onClick={() => handleCopy(tool.result?.success ? safeJson(tool.result.data) : (tool.result?.error ?? 'Unknown error'), 'output')}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {copiedOutput ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedOutput ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className={`leading-relaxed overflow-x-auto whitespace-pre-wrap break-all p-2.5 rounded-lg border border-white/5 max-h-72 overflow-y-auto ${
                tool.result?.success ? 'text-emerald-300/90 bg-black/30' : 'text-red-300/90 bg-red-950/20'
              }`}>
                {tool.result?.success
                  ? safeJson(tool.result.data)
                  : tool.result?.error ?? 'Unknown error'}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
