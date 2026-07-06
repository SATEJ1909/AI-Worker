'use client';

import type { ChatMessage } from '@/hooks/use-chat';
import { ToolCallCard } from './tool-call-card';

interface MessageBubbleProps {
  message: ChatMessage;
}

// A very lightweight markdown renderer — handles bold, italic, code, code blocks
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let codeBlock = false;
  let codeLines: string[] = [];
  let codeKey = 0;

  const flush = (i: number) => {
    if (codeLines.length > 0) {
      elements.push(
        <pre key={`code-${i}`} className="bg-black/40 border border-white/5 rounded-lg px-4 py-3 my-2 overflow-x-auto text-[12px] font-mono leading-relaxed text-emerald-300">
          {codeLines.join('\n')}
        </pre>
      );
      codeLines = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (codeBlock) {
        flush(i);
        codeBlock = false;
      } else {
        codeBlock = true;
      }
      return;
    }
    if (codeBlock) {
      codeLines.push(line);
      return;
    }

    // Heading
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="font-bold text-[13px] mt-3 mb-1 text-foreground/90">{line.slice(4)}</h3>);
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="font-bold text-[14px] mt-3 mb-1 text-foreground">{line.slice(3)}</h2>);
      return;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      elements.push(<hr key={i} className="border-white/5 my-2" />);
      return;
    }

    // Bullet list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={i} className="ml-4 list-disc leading-relaxed">
          {inlineMarkdown(line.slice(2))}
        </li>
      );
      return;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\. (.+)/);
    if (numMatch) {
      elements.push(
        <li key={i} className="ml-4 list-decimal leading-relaxed">
          {inlineMarkdown(numMatch[2])}
        </li>
      );
      return;
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      elements.push(<br key={i} />);
      return;
    }

    elements.push(
      <p key={i} className="leading-relaxed">
        {inlineMarkdown(line)}
      </p>
    );
  });

  flush(codeKey);
  return elements;
}

function inlineMarkdown(text: string): React.ReactNode[] {
  // Bold+italic, bold, italic, inline code
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index}><em>{match[2]}</em></strong>);
    } else if (match[3]) {
      parts.push(<strong key={match.index}>{match[3]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={match.index}>{match[4]}</em>);
    } else if (match[5]) {
      parts.push(
        <code key={match.index} className="bg-white/5 text-emerald-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-white/5">
          {match[5]}
        </code>
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
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border ${
        isUser
          ? 'bg-foreground/10 border-foreground/10 text-foreground/70'
          : 'bg-foreground/5 border-border text-muted-foreground'
      }`}>
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-2 max-w-[85%] min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>

        {/* Tool call cards — rendered before the text bubble for assistant */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="w-full flex flex-col gap-1.5">
            {message.toolCalls.map(tc => (
              <ToolCallCard key={tc.id} tool={tc} />
            ))}
          </div>
        )}

        {/* Text bubble — only render if there's content or it's streaming */}
        {(message.content || message.isStreaming) && (
          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed border shadow-sm ${
            isUser
              ? 'bg-foreground/10 border-foreground/10 text-foreground rounded-tr-sm'
              : 'glass text-foreground rounded-tl-sm'
          }`}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="space-y-0.5">
                {renderMarkdown(message.content)}
                {message.isStreaming && (
                  <span className="inline-block w-0.5 h-4 bg-foreground/40 animate-pulse ml-0.5 align-text-bottom rounded-full" />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
