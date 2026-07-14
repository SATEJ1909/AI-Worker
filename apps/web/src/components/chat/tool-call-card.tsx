'use client';

import { useState } from 'react';
import {
  Copy, Check, ChevronDown, Loader2, CheckCircle2, AlertCircle,
  GitBranch, GitPullRequest, GitCommit, FileCode, Search, Star,
  FolderGit2, ExternalLink, ShieldCheck, ShieldAlert, MessageSquare, Code2
} from 'lucide-react';
import type { ToolCallEntry } from '@/hooks/use-chat';

interface ToolCallCardProps {
  tool: ToolCallEntry;
}

const statusConfig = {
  running: {
    label: 'Running',
    color: 'text-amber-400',
    borderColor: 'border-amber-400/30',
    bg: 'bg-amber-500/[0.04]',
    badgeBg: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
    icon: <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />,
  },
  success: {
    label: 'Done',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bg: 'bg-emerald-500/[0.03]',
    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
  },
  error: {
    label: 'Failed',
    color: 'text-red-400',
    borderColor: 'border-red-500/30',
    bg: 'bg-red-500/[0.04]',
    badgeBg: 'bg-red-500/10 text-red-300 border-red-500/20',
    icon: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
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
      return `File content (${lines} line${lines === 1 ? '' : 's'})`;
    }
    if ('number' in data && 'title' in data) {
      return `PR #${(data as any).number}: ${(data as any).title}`;
    }
    const keys = Object.keys(data);
    if (keys.length > 0) {
      return `Returned object (${keys.length} propert${keys.length === 1 ? 'y' : 'ies'})`;
    }
  }
  return null;
}

// ─── Interactive Renderers for GitHub Tools ──────────────────────────────────

function renderReposView(data: unknown) {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-black/40">
      {data.slice(0, 10).map((repo: any, idx: number) => (
        <div key={idx} className="p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all flex flex-col justify-between gap-2 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FolderGit2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-xs text-foreground truncate">{repo.name || repo.fullName}</span>
            </div>
            {repo.private ? (
              <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">Private</span>
            ) : (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">Public</span>
            )}
          </div>
          {repo.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{repo.description}</p>
          )}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 pt-1 border-t border-white/5 mt-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                <Star className="w-3.5 h-3.5 fill-current" />
                {repo.stars || 0}
              </span>
            </div>
            {repo.htmlUrl && (
              <a
                href={repo.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium hover:underline"
              >
                <span>Open</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      ))}
      {data.length > 10 && (
        <div className="col-span-full text-center py-1.5 text-[11px] text-muted-foreground italic">
          +{data.length - 10} more repositories returned
        </div>
      )}
    </div>
  );
}

function renderPullRequestsView(data: unknown) {
  const prs = Array.isArray(data) ? data : [data];
  if (prs.length === 0 || !prs[0] || typeof prs[0] !== 'object' || !('number' in prs[0])) return null;

  return (
    <div className="divide-y divide-white/5 bg-black/40">
      {prs.map((pr: any, idx: number) => (
        <div key={idx} className="p-3.5 hover:bg-white/[0.02] transition-colors flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <GitPullRequest className={`w-4 h-4 shrink-0 ${pr.state === 'closed' ? (pr.mergedAt ? 'text-purple-400' : 'text-red-400') : 'text-emerald-400'}`} />
              <span className="font-semibold text-xs text-foreground truncate">
                #{pr.number}: {pr.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {pr.draft && (
                <span className="text-[10px] bg-secondary text-muted-foreground border border-border px-2 py-0.5 rounded-full font-mono">Draft</span>
              )}
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                pr.state === 'closed'
                  ? pr.mergedAt ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              }`}>
                {pr.state === 'closed' ? (pr.mergedAt ? 'Merged' : 'Closed') : 'Open'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 pl-6.5">
            <div className="flex items-center gap-2 font-mono">
              <span className="bg-white/[0.06] text-foreground/90 px-1.5 py-0.5 rounded">{pr.head || 'feature'}</span>
              <span>→</span>
              <span className="bg-white/[0.06] text-foreground/90 px-1.5 py-0.5 rounded">{pr.base || 'main'}</span>
            </div>
            {pr.htmlUrl && (
              <a
                href={pr.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium hover:underline"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderIssuesView(data: unknown) {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div className="divide-y divide-white/5 bg-black/40">
      {data.map((issue: any, idx: number) => (
        <div key={idx} className="p-3.5 hover:bg-white/[0.02] transition-colors flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold text-xs text-foreground truncate">
                #{issue.number}: {issue.title}
              </span>
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
              issue.state === 'closed'
                ? 'bg-red-500/10 text-red-300 border-red-500/20'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
            }`}>
              {issue.state}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 pl-6.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {Array.isArray(issue.labels) && issue.labels.map((l: string, i: number) => (
                <span key={i} className="bg-white/[0.06] text-foreground/80 px-2 py-0.5 rounded-md font-sans text-[10px] border border-white/5">
                  {l}
                </span>
              ))}
            </div>
            {issue.htmlUrl && (
              <a
                href={issue.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium hover:underline shrink-0"
              >
                <span>Open Issue</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderBranchesView(data: unknown) {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-black/40">
      {data.map((branch: any, idx: number) => (
        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-mono">
          <div className="flex items-center gap-2 min-w-0">
            <GitBranch className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="font-semibold text-foreground truncate">{branch.name}</span>
          </div>
          {branch.protected ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
              <ShieldCheck className="w-3 h-3" /> Protected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-white/5 border border-white/10 px-2 py-0.5 rounded-full shrink-0">
              Unprotected
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function renderFileContentView(data: unknown) {
  if (!data || typeof data !== 'object' || !('content' in data)) return null;
  const fileData = data as { content: string; path?: string };
  const lines = fileData.content?.split('\n') || [];

  return (
    <div className="bg-black/60 font-mono text-xs overflow-hidden border-t border-white/5">
      <div className="flex items-center justify-between px-3.5 py-2 bg-white/[0.04] border-b border-white/10 text-muted-foreground">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-foreground">{fileData.path || 'Code File'}</span>
          <span className="text-[11px] opacity-70">({lines.length} lines)</span>
        </div>
      </div>
      <div className="p-3.5 max-h-80 overflow-y-auto overflow-x-auto text-emerald-300/90 leading-relaxed bg-black/40 selection:bg-emerald-500/30">
        <pre>{fileData.content}</pre>
      </div>
    </div>
  );
}

// ─── Main Tool Call Card Component ───────────────────────────────────────────

export function ToolCallCard({ tool }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
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

  // Determine if we have a specialized visual renderer for this tool's output
  let specializedView: React.ReactNode | null = null;
  if (tool.result?.success && !showRawJson && tool.result.data) {
    if (tool.toolName === 'github_list_repos') {
      specializedView = renderReposView(tool.result.data);
    } else if (tool.toolName === 'github_list_pull_requests' || tool.toolName === 'github_create_pr' || tool.toolName === 'github_update_pr') {
      specializedView = renderPullRequestsView(tool.result.data);
    } else if (tool.toolName === 'github_list_issues') {
      specializedView = renderIssuesView(tool.result.data);
    } else if (tool.toolName === 'github_list_branches') {
      specializedView = renderBranchesView(tool.result.data);
    } else if (tool.toolName === 'github_get_file_content') {
      specializedView = renderFileContentView(tool.result.data);
    }
  }

  return (
    <div className={`rounded-xl border ${cfg.borderColor} ${cfg.bg} text-xs font-mono overflow-hidden transition-all duration-200 my-1.5 shadow-md backdrop-blur-md`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white/[0.02]">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left group cursor-pointer"
        >
          {cfg.icon}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm truncate text-foreground/95 group-hover:text-emerald-400 transition-colors font-sans">
              {formatToolName(tool.toolName)}
            </span>
            {summary && !expanded && (
              <span className="hidden sm:inline-block text-[11.5px] font-sans text-muted-foreground truncate border-l border-white/10 pl-2 opacity-90">
                {summary}
              </span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {hasOutput && tool.result?.success && (
            <button
              onClick={() => {
                setShowRawJson(v => !v);
                if (!expanded) setExpanded(true);
              }}
              className="px-2 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[10px] text-muted-foreground hover:text-foreground border border-white/10 font-sans transition-all"
              title="Toggle raw JSON view"
            >
              {showRawJson ? 'Visual UI' : 'Raw JSON'}
            </button>
          )}
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.badgeBg}`}>
            {cfg.label}
          </span>
          {(hasInput || hasOutput) && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details / Visual Output */}
      {expanded && (
        <div className="border-t border-white/10 bg-black/30 text-[11px] animate-in fade-in duration-200">
          {/* Input arguments summary bar */}
          {hasInput && (
            <div className="px-3.5 py-2 border-b border-white/5 flex items-center justify-between bg-white/[0.015]">
              <span className="text-[10px] uppercase tracking-widest font-sans font-semibold text-muted-foreground/70">
                Parameters: <code className="text-foreground/80 lowercase">{safeJson(tool.input).replace(/\n\s*/g, ' ')}</code>
              </span>
              <button
                onClick={() => handleCopy(safeJson(tool.input), 'input')}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors shrink-0"
              >
                {copiedInput ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedInput ? 'Copied' : 'Args'}
              </button>
            </div>
          )}

          {/* Specialized Interactive View or Raw Output */}
          {specializedView ? (
            specializedView
          ) : hasOutput ? (
            <div className="p-3 relative group/box">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-widest font-sans font-semibold text-muted-foreground/70">
                  {tool.result?.success ? 'Result Data' : 'Error Details'}
                </span>
                <button
                  onClick={() => handleCopy(tool.result?.success ? safeJson(tool.result.data) : (tool.result?.error ?? 'Unknown error'), 'output')}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {copiedOutput ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedOutput ? 'Copied' : 'Copy Output'}
                </button>
              </div>
              <pre className={`leading-relaxed overflow-x-auto whitespace-pre-wrap break-all p-3 rounded-xl border border-white/10 max-h-80 overflow-y-auto ${
                tool.result?.success ? 'text-emerald-300/95 bg-black/50' : 'text-red-300/90 bg-red-950/25'
              }`}>
                {tool.result?.success
                  ? safeJson(tool.result.data)
                  : tool.result?.error ?? 'Unknown error'}
              </pre>
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground/80 flex items-center justify-center gap-2 font-sans">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Executing tool against remote API…</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
