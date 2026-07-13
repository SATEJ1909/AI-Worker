'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, Send, Plus, Trash2, MessageSquare, ChevronRight,
  Loader2, Sparkles, X, Menu
} from 'lucide-react';
import { useWorkspace } from '@/context/workspace-context';
import { useChat, type Conversation } from '@/hooks/use-chat';
import { MessageBubble } from '@/components/chat/message-bubble';

// ─── Format date helpers ─────────────────────────────────────────────────────

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Conversation sidebar item ───────────────────────────────────────────────

function ConversationItem({
  conv,
  isActive,
  onSelect,
  onDelete,
}: {
  conv: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150 ${
        isActive
          ? 'bg-white/[0.06] text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
      }`}
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
      <span className="flex-1 text-xs truncate font-medium">
        {conv.title ?? 'New conversation'}
      </span>
      <span className="text-[10px] opacity-40 shrink-0 hidden group-hover:block">
        {formatRelative(conv.updatedAt)}
      </span>
      {showDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ─── Typing indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-foreground/10 border border-foreground/10 flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground">
        AI
      </div>
      <div className="surface px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onPromptClick }: { onPromptClick: (p: string) => void }) {
  const prompts = [
    'List all my GitHub repositories',
    'Search for "useState" across my repos',
    'Show me the README from my latest repo',
    'Create a bug report issue in a repository',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-6 text-center animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center animate-float">
          <Sparkles className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-[family-name:var(--font-sora)]">TaskMind Agent</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            I can interact with your connected tools. Ask me to do something.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
        {prompts.map(p => (
          <button
            key={p}
            onClick={() => onPromptClick(p)}
            className="text-left px-4 py-3 rounded-lg border border-border hover:bg-white/[0.03] transition-colors duration-150 text-xs text-muted-foreground hover:text-foreground group"
          >
            <span className="text-foreground/40 group-hover:text-foreground/60 mr-1.5">›</span>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main chat page ───────────────────────────────────────────────────────────

export default function ChatPage() {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const {
    conversations,
    activeConversationId,
    messages,
    isStreaming,
    isLoadingConversations,
    isLoadingMessages,
    fetchConversations,
    loadConversation,
    deleteConversation,
    sendMessage,
    startNewConversation,
  } = useChat(workspaceId);

  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    if (workspaceId) fetchConversations();
  }, [workspaceId, fetchConversations]);

  // Auto-scroll (throttled to avoid jank during streaming)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (scrollTimerRef.current) return;
    scrollTimerRef.current = setTimeout(() => {
      scrollTimerRef.current = null;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
  }, [input]);

  const handleSend = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || isStreaming) return;
      setInput('');
      await sendMessage(content);
    },
    [input, isStreaming, sendMessage],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── No workspace selected ─────────────────────────────────────────────────
  if (!workspaceId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4">
        <Bot className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">No workspace selected</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Select or create a workspace to start chatting with the AI agent.
        </p>
      </div>
    );
  }

  const showMessages = messages.length > 0;
  const showTyping = isStreaming && messages.length > 0 && messages[messages.length - 1].role !== 'assistant';

  return (
    <div className="flex h-full overflow-hidden bg-background">

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <div className={`flex flex-col shrink-0 border-r border-border bg-card/30 backdrop-blur-sm transition-all duration-300 overflow-hidden ${
        sidebarOpen ? 'w-60' : 'w-0'
      }`}>
        <div className="p-3 border-b border-border flex items-center justify-between min-w-[240px]">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Conversations</span>
          <button
            onClick={startNewConversation}
            className="p-1.5 rounded-lg hover:bg-secondary transition-all duration-200 text-muted-foreground hover:text-foreground"
            title="New conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 min-w-[240px]">
          {isLoadingConversations ? (
            <div className="space-y-1.5 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-8 rounded-lg" style={{ opacity: 1 - i * 0.2 }} />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 px-2">
              No conversations yet. Send a message to start one.
            </p>
          ) : (
            conversations.map(conv => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConversationId}
                onSelect={() => loadConversation(conv.id)}
                onDelete={() => deleteConversation(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Main chat area ────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="p-1.5 rounded-lg hover:bg-secondary transition-all duration-200 text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-border flex items-center justify-center">
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-bold leading-none">TaskMind</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-muted-foreground">
                    {activeWorkspace.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {activeConversationId && (
            <button
              onClick={startNewConversation}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-secondary transition-all duration-200 border border-transparent hover:border-border"
            >
              <Plus className="w-3.5 h-3.5" />
              New chat
            </button>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !showMessages ? (
            <EmptyState onPromptClick={p => handleSend(p)} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {showTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-4 pb-4 pt-2 bg-background shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 border border-border rounded-xl p-2 focus-within:ring-1 focus-within:ring-foreground/10 focus-within:border-foreground/15 transition-all duration-150">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask TaskMind to do anything… (Shift+Enter for new line)"
                disabled={isStreaming}
                rows={1}
                className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none resize-none py-3 px-2 text-sm focus:outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
              />

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                className="shrink-0 p-2.5 rounded-xl bg-foreground text-background hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 mb-0.5"
              >
                {isStreaming
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>

            <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
              TaskMind can use your connected tools. Verify important results.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
