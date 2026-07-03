// ─── Tool System Type Definitions ───────────────────────────────────────────

export interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    required: boolean;
    enum?: string[];
}

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: ToolParameter[];
    requiresIntegration?: string;
}

export interface ToolExecutionContext {
    userId: string;
    workspaceId: string;
}

export interface ToolResult {
    success: boolean;
    data?: unknown;
    error?: string;
}

export interface Tool {
    definition: ToolDefinition;
    execute(
        params: Record<string, unknown>,
        context: ToolExecutionContext,
    ): Promise<ToolResult>;
}
