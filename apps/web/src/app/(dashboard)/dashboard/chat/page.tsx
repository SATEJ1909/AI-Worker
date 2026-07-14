'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Bot, Send, Plus, Trash2, MessageSquare, ChevronRight,
  Loader2, Sparkles, X, Menu, Square, ArrowUpRight, Terminal, GitBranch
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

function getConversationGroup(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (date.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  if (diffDays <= 7) return 'Previous 7 Days';
  return 'Older';
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
      className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
        isActive
          ? 'bg-white/[0.08] text-foreground font-medium shadow-sm border border-white/[0.06]'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
      }`}
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <MessageSquare className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'opacity-60 group-hover:opacity-100'}`} />
      <span className="flex-1 text-xs truncate">
        {conv.title ?? 'New conversation'}
      </span>
      <span className="text-[10px] opacity-40 shrink-0 hidden group-hover:block transition-opacity">
        {formatRelative(conv.updatedAt)}
      </span>
      {showDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Delete chat"
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
    <div className="flex gap-3.5 animate-in fade-in duration-300">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm">
        <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
      </div>
      <div className="bg-card/70 border border-border/80 px-4 py-3.5 rounded-2xl rounded-tl-sm flex items-center gap-2 shadow-sm backdrop-blur-md">
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]" />
        <span className="text-xs text-muted-foreground ml-1 font-mono">TaskMind AI is working…</span>
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onPromptClick }: { onPromptClick: (p: string) => void }) {
  const prompts = [
    {
      title: 'List my GitHub repositories',
      desc: 'Retrieve all accessible repositories, stars, and access levels',
      icon: <GitBranch className="w-4 h-4 text-emerald-400" />,
      prompt: 'List all my GitHub repositories and show their stars, update dates, and visibility.',
    },
    {
      title: 'Check Pull Requests & Branches',
      desc: 'Inspect open PR flow, drafts, and protected branches',
      icon: <Terminal className="w-4 h-4 text-teal-400" />,
      prompt: 'List all open pull requests and show the branch protection status across my repos.',
    },
    {
      title: 'Review Recent Issues',
      desc: 'Look up open issues, label tags, and comment activity',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      prompt: 'Check for open issues across my GitHub repositories and summarize their status.',
    },
    {
      title: 'Inspect & Analyze Code Files',
      desc: 'Fetch README or source code directly from GitHub',
      icon: <ArrowUpRight className="w-4 h-4 text-blue-400" />,
      prompt: 'Find my most recently pushed GitHub repository and inspect its README.md file.',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-6 text-center animate-in fade-in duration-500 max-w-2xl mx-auto py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-emerald-500/30 to-teal-500/30 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-card to-background border border-white/15 flex items-center justify-center shadow-2xl">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-sora)] text-foreground tracking-tight">TaskMind AI Agent</h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md leading-relaxed">
            Your autonomous engineering assistant. Powered by Nemotron 120B and connected directly to your GitHub workspace.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
        {prompts.map(p => (
          <button
            key={p.title}
            onClick={() => onPromptClick(p.prompt)}
            className="text-left p-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] hover:bg-white/[0.08] hover:border-emerald-500/30 transition-all duration-200 group flex flex-col justify-between h-28 shadow-lg hover:shadow-emerald-500/5 cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-xs text-foreground/95 group-hover:text-emerald-400 transition-colors font-sans">
                {p.title}
              </span>
              <span className="p-1.5 rounded-xl bg-white/[0.06] group-hover:bg-emerald-500/15 transition-colors shadow-inner">
                {p.icon}
              </span>
            </div>
            <p className="text-[11.5px] text-muted-foreground/85 line-clamp-2 leading-relaxed font-sans">
              {p.desc}
            </p>
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
    stopStreaming,
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

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const groups: { [key: string]: Conversation[] } = {};
    const order = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'];

    conversations.forEach(conv => {
      const group = getConversationGroup(conv.updatedAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(conv);
    });

    return order
      .map(groupName => ({
        groupName,
        items: groups[groupName] || [],
      }))
      .filter(g => g.items.length > 0);
  }, [conversations]);

  // ── No workspace selected ─────────────────────────────────────────────────
  if (!workspaceId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4 bg-background">
        <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center shadow-lg">
          <Bot className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold font-[family-name:var(--font-sora)]">No workspace selected</h2>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Select or create a workspace from the sidebar to start chatting with the TaskMind AI agent.
        </p>
      </div>
    );
  }

  const showMessages = messages.length > 0;
  const showTyping = isStreaming && messages.length > 0 && messages[messages.length - 1].role !== 'assistant';

  const quickChips = [
    { label: '⚡ List Repos', prompt: 'List my GitHub repositories with stars and protection details.' },
    { label: '🐛 Open Issues', prompt: 'Find all open issues across my repositories and show labels.' },
    { label: '🔀 Check PRs', prompt: 'Check open pull requests and summarize branch flow.' },
    { label: '🌿 Branches', prompt: 'List branches and check branch protection rules.' },
  ];

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-background">

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <div className={`flex flex-col shrink-0 border-r border-border bg-card/30 backdrop-blur-xl transition-all duration-300 overflow-hidden ${
        sidebarOpen ? 'w-64' : 'w-0'
      }`}>
        <div className="p-3 border-b border-border flex items-center justify-between min-w-[256px]">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            History ({conversations.length})
          </span>
          <button
            onClick={startNewConversation}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] transition-all duration-200 text-muted-foreground hover:text-foreground border border-white/5"
            title="New conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-4 min-w-[256px]">
          {isLoadingConversations ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-9 rounded-xl bg-white/[0.04]" style={{ opacity: 1 - i * 0.18 }} />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-2">
              <Sparkles className="w-5 h-5 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground font-medium">
                No history yet
              </p>
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                Send a message or pick a suggestion to start an AI session.
              </p>
            </div>
          ) : (
            groupedConversations.map(group => (
              <div key={group.groupName} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  {group.groupName}
                </div>
                <div className="space-y-0.5">
                  {group.items.map(conv => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={conv.id === activeConversationId}
                      onSelect={() => loadConversation(conv.id)}
                      onDelete={() => deleteConversation(conv.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Main chat area ────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">

        {/* Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="p-1.5 rounded-lg hover:bg-secondary transition-all duration-200 text-muted-foreground hover:text-foreground"
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold leading-none text-foreground font-[family-name:var(--font-sora)]">TaskMind AI</h1>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-medium hidden sm:inline-block">
                    Nemotron 120B
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                    Workspace: <strong className="text-foreground/90 font-medium">{activeWorkspace.name}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeConversationId && (
              <button
                onClick={startNewConversation}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200 border border-white/10 shadow-sm font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                New session
              </button>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingMessages ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-xs font-medium">Loading session history…</span>
            </div>
          ) : !showMessages ? (
            <EmptyState onPromptClick={p => handleSend(p)} />
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {showTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area & Quick Action Chips */}
        <div className="px-4 pb-4 pt-2 bg-background shrink-0 border-t border-border/40">
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            {/* Quick action chips bar */}
            {showMessages && !isStreaming && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider mr-1 shrink-0">
                  Quick Actions:
                </span>
                {quickChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip.prompt)}
                    className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-emerald-500/15 text-muted-foreground hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 transition-all font-sans cursor-pointer shadow-sm"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input box */}
            <div className="relative flex items-end gap-2 border border-white/15 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500/50 bg-card/60 backdrop-blur-xl shadow-xl transition-all duration-200">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask TaskMind to inspect repos, analyze issues, write code, or run tasks… (Shift+Enter for new line)"
                disabled={isStreaming}
                rows={1}
                className="flex-1 max-h-36 min-h-[44px] bg-transparent border-none resize-none py-3 px-3 text-sm focus:outline-none placeholder:text-muted-foreground/60 disabled:opacity-50 font-sans leading-relaxed text-foreground"
              />

              {isStreaming ? (
                <button
                  onClick={stopStreaming}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all duration-200 text-xs font-semibold mb-0.5 shadow-sm cursor-pointer"
                  title="Stop generating"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              ) : (
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="shrink-0 p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-background hover:opacity-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 mb-0.5 shadow-md hover:shadow-emerald-500/20 cursor-pointer"
                >
                  <Send className="w-4 h-4 fill-current" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between px-1 mt-1 text-[11px] text-muted-foreground/60 font-sans">
              <div className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Connected Workspace: <strong className="text-foreground/80">{activeWorkspace.name}</strong></span>
              </div>
              <span>TaskMind can execute tools against remote APIs. Verify code outputs.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
