// ─── Tool Executor ──────────────────────────────────────────────────────────
//
// Executes a tool by name, handles timeouts, and logs every execution
// to the ToolExecution table for observability.

import { toolRegistry } from './tool.registry.js';
import type { ToolExecutionContext, ToolResult } from './tool.types.js';
import { prisma } from '../../config/prisma.js';

const DEFAULT_TIMEOUT_MS = 30_000;

export async function executeTool(
    toolName: string,
    params: Record<string, unknown>,
    context: ToolExecutionContext,
    conversationId?: string,
): Promise<ToolResult> {
    const tool = toolRegistry.get(toolName);

    if (!tool) {
        const result: ToolResult = {
            success: false,
            error: `Tool "${toolName}" not found`,
        };
        await logExecution(toolName, params, result, 'not_found', conversationId);
        return result;
    }

    // Check integration requirement
    if (tool.definition.requiresIntegration) {
        const integration = await prisma.integration.findFirst({
            where: {
                workspaceId: context.workspaceId,
                provider: tool.definition.requiresIntegration,
            },
            select: { id: true },
        });

        if (!integration) {
            const result: ToolResult = {
                success: false,
                error: `Tool "${toolName}" requires the "${tool.definition.requiresIntegration}" integration to be connected.`,
            };
            await logExecution(toolName, params, result, 'missing_integration', conversationId);
            return result;
        }
    }

    const startTime = Date.now();

    try {
        const result = await Promise.race([
            tool.execute(params, context),
            timeout(DEFAULT_TIMEOUT_MS),
        ]);

        const duration = Date.now() - startTime;
        console.log(`[ToolExecutor] ${toolName} completed in ${duration}ms`);

        await logExecution(toolName, params, result, 'success', conversationId);
        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[ToolExecutor] ${toolName} failed after ${duration}ms:`, errorMessage);

        const result: ToolResult = {
            success: false,
            error: errorMessage,
        };

        await logExecution(toolName, params, result, 'error', conversationId);
        return result;
    }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Tool execution timed out after ${ms}ms`)), ms);
    });
}

async function logExecution(
    toolName: string,
    input: unknown,
    output: ToolResult,
    status: string,
    conversationId?: string,
): Promise<void> {
    try {
        await prisma.toolExecution.create({
            data: {
                toolName,
                input: input as any,
                output: output as any,
                status,
                conversationId: conversationId ?? null,
            },
        });
    } catch (err) {
        // Don't let logging failures crash the tool execution
        console.error('[ToolExecutor] Failed to log execution:', err);
    }
}
