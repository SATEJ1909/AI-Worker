// ─── Agent Stream Event Types ───────────────────────────────────────────────

export type AgentStreamEvent =
    | { type: 'text'; content: string }
    | { type: 'tool_start'; toolName: string; input: unknown }
    | { type: 'tool_result'; toolName: string; result: { success: boolean; data?: unknown; error?: string } }
    | { type: 'error'; message: string }
    | { type: 'done'; fullContent: string };

export interface AgentLoopParams {
    workspaceId: string;
    userId: string;
    conversationId: string;
    userMessage: string;
}
