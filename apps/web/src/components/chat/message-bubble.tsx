'use client';

import { useState } from 'react';
import { Copy, Check, Sparkles, User as UserIcon } from 'lucide-react';
import type { ChatMessage } from '@/hooks/use-chat';
import { ToolCallCard } from './tool-call-card';

interface MessageBubbleProps {
  message: ChatMessage;
}

// ─── Code Block Renderer with Copy Button ────────────────────────────────────

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl border border-white/10 bg-black/60 overflow-hidden shadow-md font-mono text-[12px]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.04] border-b border-white/10 text-muted-foreground">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-foreground/80">
          {language || 'Code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded hover:bg-white/5"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto leading-relaxed text-emerald-300/95 selection:bg-emerald-500/30 selection:text-emerald-200">
        <pre>{code}</pre>
      </div>
    </div>
  );
}

// ─── Table Renderer ──────────────────────────────────────────────────────────

function TableBlock({ rows }: { rows: string[][] }) {
  if (rows.length === 0) return null;
  const [header, ...body] = rows;

  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02]">
      <table className="w-full text-left border-collapse text-xs">
        {header && (
          <thead className="bg-white/[0.05] border-b border-white/10 font-semibold text-foreground/90">
            <tr>
              {header.map((col, i) => (
                <th key={i} className="px-3.5 py-2 whitespace-nowrap">
                  {inlineMarkdown(col.trim())}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-white/5 text-foreground/80">
          {body.map((row, rIdx) => {
            // Check if separator row (---|---)
            if (row.every(cell => cell.trim().match(/^[-:]+$/))) return null;
            return (
              <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2 leading-relaxed">
                    {inlineMarkdown(cell.trim())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Markdown Renderer ───────────────────────────────────────────────────────

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code Blocks (```lang ... ```)
    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(<CodeBlock key={`code-${i}`} code={codeLines.join('\n')} language={language} />);
      i++;
      continue;
    }

    // Markdown Table (| col | col |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        const cells = lines[i].trim().slice(1, -1).split('|');
        tableRows.push(cells);
        i++;
      }
      elements.push(<TableBlock key={`table-${i}`} rows={tableRows} />);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<h3 key={`h3-${i}`} className="font-bold text-[14px] mt-4 mb-1.5 text-foreground font-[family-name:var(--font-sora)]">{inlineMarkdown(line.slice(4))}</h3>);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={`h2-${i}`} className="font-bold text-[15px] mt-4 mb-1.5 text-foreground font-[family-name:var(--font-sora)] border-b border-white/5 pb-1">{inlineMarkdown(line.slice(3))}</h2>);
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={`h1-${i}`} className="font-bold text-[16px] mt-4 mb-2 text-foreground font-[family-name:var(--font-sora)]">{inlineMarkdown(line.slice(2))}</h1>);
      i++;
      continue;
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={`bq-${i}`} className="my-2 border-l-2 border-emerald-500/50 pl-3 py-1 text-muted-foreground italic bg-white/[0.02] rounded-r-md">
          {inlineMarkdown(line.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Horizontal Rule
    if (line.match(/^---+$/) || line.match(/^\*\*\*+$/)) {
      elements.push(<hr key={`hr-${i}`} className="border-white/10 my-3.5" />);
      i++;
      continue;
    }

    // Unordered list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={`ul-${i}`} className="ml-5 list-disc leading-relaxed my-1 marker:text-emerald-400/70">
          {inlineMarkdown(line.slice(2))}
        </li>
      );
      i++;
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\. (.+)/);
    if (numMatch) {
      elements.push(
        <li key={`ol-${i}`} className="ml-5 list-decimal leading-relaxed my-1 marker:text-emerald-400/70 marker:font-mono">
          {inlineMarkdown(numMatch[2])}
        </li>
      );
      i++;
      continue;
    }

    // Empty line = paragraph spacing
    if (line.trim() === '') {
      if (elements.length > 0) {
        elements.push(<div key={`br-${i}`} className="h-2" />);
      }
      i++;
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed my-1">
        {inlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return elements;
}

function inlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index}><em>{match[2]}</em></strong>);
    } else if (match[3]) {
      parts.push(<strong key={match.index} className="text-foreground font-semibold">{match[3]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={match.index} className="text-foreground/90">{match[4]}</em>);
    } else if (match[5]) {
      parts.push(
        <code key={match.index} className="bg-white/[0.08] text-emerald-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-white/10 shadow-inner">
          {match[5]}
        </code>
      );
    } else if (match[6] && match[7]) {
      parts.push(
        <a
          key={match.index}
          href={match[7]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
        >
          {match[6]}
        </a>
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3.5 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform duration-200 group-hover:scale-105 ${
          isUser
            ? 'bg-gradient-to-br from-white/15 to-white/5 border-white/10 text-foreground/80'
            : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-500/20 text-emerald-400'
        }`}
      >
        {isUser ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4 animate-pulse" />}
      </div>

      {/* Content Area */}
      <div className={`flex flex-col gap-2.5 max-w-[85%] min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Tool Call Cards (rendered before assistant text) */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="w-full flex flex-col gap-1.5">
            {message.toolCalls.map(tc => (
              <ToolCallCard key={tc.id} tool={tc} />
            ))}
          </div>
        )}

        {/* Text Bubble */}
        {(message.content || message.isStreaming) && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all duration-200 ${
              isUser
                ? 'bg-white/[0.08] border border-white/10 text-foreground rounded-tr-sm hover:border-white/15'
                : 'bg-card/70 border border-border/80 text-foreground rounded-tl-sm backdrop-blur-md hover:border-border'
            }`}
          >
            {message.content ? (
              <div className="space-y-1 text-[13.5px]">
                {renderMarkdown(message.content)}
              </div>
            ) : message.isStreaming ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground italic text-xs py-1">
                Thinking and planning…
              </span>
            ) : null}
          </div>
        )}

        {/* Timestamp / Status footer */}
        <div className={`flex items-center gap-2 px-1 text-[10px] text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isUser && <span>• You</span>}
          {!isUser && <span>• TaskMind AI</span>}
        </div>
      </div>
    </div>
  );
}
