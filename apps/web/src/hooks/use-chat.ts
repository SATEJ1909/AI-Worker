'use client';

import { useState, useCallback, useRef } from 'react';
import { apiFetch, getAccessToken, API_BASE } from '@/lib/api-client';

// ─── Types (mirror AgentStreamEvent from backend) ──────────────────────────

export type MessageRole = 'user' | 'assistant';

export interface ToolCallEntry {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  result?: { success: boolean; data?: unknown; error?: string };
  status: 'running' | 'success' | 'error';
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCallEntry[];
  createdAt: Date;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  messages?: DbMessage[];
}

interface DbMessage {
  id: string;
  role: string;
  content: string;
  toolCalls: unknown;
  createdAt: string;
}

type AgentStreamEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_start'; toolName: string; input: unknown }
  | { type: 'tool_result'; toolName: string; result: { success: boolean; data?: unknown; error?: string } }
  | { type: 'error'; message: string }
  | { type: 'done'; fullContent: string };

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function dbMessagesToChatMessages(msgs: DbMessage[]): ChatMessage[] {
  const result: ChatMessage[] = [];
  let pending: ChatMessage | null = null;

  for (const msg of msgs) {
    if (msg.role === 'user') {
      if (pending) result.push(pending);
      pending = null;
      result.push({
        id: msg.id,
        role: 'user',
        content: msg.content,
        createdAt: new Date(msg.createdAt),
      });
    } else if (msg.role === 'assistant') {
      if (pending) result.push(pending);
      pending = {
        id: msg.id,
        role: 'assistant',
        content: msg.content,
        toolCalls: [],
        createdAt: new Date(msg.createdAt),
      };
    } else if (msg.role === 'tool_call') {
      // Attach to the most recent assistant message
      const toolCallsRaw = msg.toolCalls as Array<{ name: string; args: Record<string, unknown> }> | null;
      if (pending && toolCallsRaw) {
        for (const tc of toolCallsRaw) {
          pending.toolCalls = pending.toolCalls ?? [];
          pending.toolCalls.push({
            id: makeId(),
            toolName: tc.name,
            input: tc.args,
            status: 'running',
          });
        }
      }
    } else if (msg.role === 'tool_result') {
      const toolCallsRaw = msg.toolCalls as Array<{ name: string; result: { success: boolean; data?: unknown; error?: string } }> | null;
      if (pending && toolCallsRaw) {
        for (const tc of toolCallsRaw) {
          const existing = pending.toolCalls?.find(c => c.toolName === tc.name && c.status === 'running');
          if (existing) {
            existing.result = tc.result;
            existing.status = tc.result.success ? 'success' : 'error';
          }
        }
      }
    }
  }

  if (pending) result.push(pending);
  return result;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useChat(workspaceId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingTextRef = useRef<string>('');

  // ── Fetch conversations ───────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoadingConversations(true);
    try {
      const res = await apiFetch(`${API_BASE}/workspaces/${workspaceId}/chat`);
      const data = await res.json();
      if (data.success) setConversations(data.conversations ?? []);
    } catch (err) {
      console.error('[useChat] fetchConversations error:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [workspaceId]);

  // ── Load a specific conversation's messages ───────────────────────────────

  const loadConversation = useCallback(async (conversationId: string) => {
    if (!workspaceId) return;
    setIsLoadingMessages(true);
    setActiveConversationId(conversationId);
    try {
      const res = await apiFetch(`${API_BASE}/workspaces/${workspaceId}/chat/${conversationId}`);
      const data = await res.json();
      if (data.success && data.conversation) {
        const msgs = dbMessagesToChatMessages(data.conversation.messages ?? []);
        setMessages(msgs);
      }
    } catch (err) {
      console.error('[useChat] loadConversation error:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [workspaceId]);

  // ── Create a new conversation ─────────────────────────────────────────────

  const createConversation = useCallback(async (): Promise<string | null> => {
    if (!workspaceId) return null;
    try {
      const res = await apiFetch(`${API_BASE}/workspaces/${workspaceId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        await fetchConversations();
        return data.conversation.id;
      }
    } catch (err) {
      console.error('[useChat] createConversation error:', err);
    }
    return null;
  }, [workspaceId, fetchConversations]);

  // ── Delete a conversation ─────────────────────────────────────────────────

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!workspaceId) return;
    try {
      await apiFetch(`${API_BASE}/workspaces/${workspaceId}/chat/${conversationId}`, {
        method: 'DELETE',
      });
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
      await fetchConversations();
    } catch (err) {
      console.error('[useChat] deleteConversation error:', err);
    }
  }, [workspaceId, activeConversationId, fetchConversations]);

  // ── Send a message (core SSE loop) ────────────────────────────────────────

  const sendMessage = useCallback(async (content: string) => {
    if (!workspaceId || !content.trim() || isStreaming) return;

    // Get or create a conversation
    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = await createConversation();
      if (!conversationId) return;
      setActiveConversationId(conversationId);
    }

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: content.trim(),
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Prepare streaming assistant placeholder
    const assistantMsgId = makeId();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      toolCalls: [],
      createdAt: new Date(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, assistantMsg]);
    setIsStreaming(true);

    // Track active tool calls for this response
    const activeToolCalls: Map<string, ToolCallEntry> = new Map();

    abortRef.current = new AbortController();

    try {
      const res = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/chat/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: content.trim() }),
          signal: abortRef.current.signal,
        },
      );

      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;

          let event: AgentStreamEvent;
          try {
            event = JSON.parse(raw);
          } catch {
            continue;
          }

          // ── Handle each event type ───────────────────────────────────────
          if (event.type === 'text') {
            // Batch text updates via RAF to avoid per-token re-renders
            pendingTextRef.current += event.content;
            if (rafRef.current === null) {
              rafRef.current = requestAnimationFrame(() => {
                const chunk = pendingTextRef.current;
                pendingTextRef.current = '';
                rafRef.current = null;
                if (chunk) {
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMsgId
                        ? { ...m, content: m.content + chunk }
                        : m,
                    ),
                  );
                }
              });
            }
          } else if (event.type === 'tool_start') {
            const entry: ToolCallEntry = {
              id: makeId(),
              toolName: event.toolName,
              input: event.input as Record<string, unknown>,
              status: 'running',
            };
            activeToolCalls.set(event.toolName, entry);
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, toolCalls: [...(m.toolCalls ?? []), entry] }
                  : m,
              ),
            );
          } else if (event.type === 'tool_result') {
            const existing = activeToolCalls.get(event.toolName);
            if (existing) {
              existing.result = event.result;
              existing.status = event.result.success ? 'success' : 'error';
            }
            setMessages(prev =>
              prev.map(m => {
                if (m.id !== assistantMsgId) return m;
                return {
                  ...m,
                  toolCalls: (m.toolCalls ?? []).map(tc =>
                    tc.toolName === event.toolName && tc.status === 'running'
                      ? {
                          ...tc,
                          result: event.result,
                          status: event.result.success ? 'success' : 'error',
                        }
                      : tc,
                  ),
                };
              }),
            );
          } else if (event.type === 'error') {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content || `⚠️ ${event.message}`, isStreaming: false }
                  : m,
              ),
            );
          } else if (event.type === 'done') {
            // Finalise
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('[useChat] streaming error:', err);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: m.content || '⚠️ Connection error. Please try again.', isStreaming: false }
            : m,
        ),
      );
    } finally {
      // Flush any remaining buffered text
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const remaining = pendingTextRef.current;
      pendingTextRef.current = '';

      setIsStreaming(false);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: m.content + remaining, isStreaming: false }
            : m,
        ),
      );
      // Refresh conversation list so the title updates
      fetchConversations();
    }
  }, [workspaceId, activeConversationId, isStreaming, createConversation, fetchConversations]);

  // ── New conversation ──────────────────────────────────────────────────────

  const startNewConversation = useCallback(() => {
    abortRef.current?.abort();
    setActiveConversationId(null);
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return {
    conversations,
    activeConversationId,
    messages,
    isStreaming,
    isLoadingConversations,
    isLoadingMessages,
    fetchConversations,
    loadConversation,
    createConversation,
    deleteConversation,
    sendMessage,
    startNewConversation,
  };
}
