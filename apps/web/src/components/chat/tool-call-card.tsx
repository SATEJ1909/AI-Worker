'use client';

import { useState } from 'react';
import type { ToolCallEntry } from '@/hooks/use-chat';

interface ToolCallCardProps {
  tool: ToolCallEntry;
}

const statusConfig = {
  running: {
    label: 'Running',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
    dot: 'bg-amber-400 animate-pulse',
    icon: (
      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ),
  },
  success: {
    label: 'Done',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10 border-emerald-400/20',
    dot: 'bg-emerald-400',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    label: 'Failed',
    color: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/20',
    dot: 'bg-red-400',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
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

export function ToolCallCard({ tool }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[tool.status];

  const hasInput = Object.keys(tool.input ?? {}).length > 0;
  const hasOutput = tool.result !== undefined;

  return (
    <div className={`rounded-lg border text-xs font-mono overflow-hidden transition-all duration-200 ${cfg.bg}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:brightness-125 transition-all ${cfg.color}`}
      >
        {/* Status icon */}
        <span className="shrink-0">{cfg.icon}</span>

        {/* Tool name */}
        <span className="flex-1 font-semibold truncate">
          🔧 {formatToolName(tool.toolName)}
        </span>

        {/* Status badge */}
        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.color}`}>
          {cfg.label}
        </span>

        {/* Expand chevron */}
        {(hasInput || hasOutput) && (
          <svg
            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-current/10 divide-y divide-current/10">
          {hasInput && (
            <div className="px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1.5 font-sans font-semibold">Input</p>
              <pre className="text-[11px] leading-relaxed opacity-80 overflow-x-auto whitespace-pre-wrap break-all">
                {safeJson(tool.input)}
              </pre>
            </div>
          )}
          {hasOutput && (
            <div className="px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1.5 font-sans font-semibold">
                {tool.result?.success ? 'Output' : 'Error'}
              </p>
              <pre className="text-[11px] leading-relaxed opacity-80 overflow-x-auto whitespace-pre-wrap break-all">
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
