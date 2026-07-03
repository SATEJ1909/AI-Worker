// ─── Agent Orchestrator ─────────────────────────────────────────────────────
//
// The core agentic loop.
//
// Provider strategy:
//   PRIMARY  → OpenRouter with primary model (nvidia/nemotron-3-super-120b-a12b:free)
//   CASCADE  → OpenRouter fallback chain (qwen/qwen3-coder, gpt-oss-120b, llama-3.3-70b)
//   LAST RESORT → Google Gemini (if all OpenRouter attempts fail)
//
// The loop:
//   1. Load context (history, workspace, tools)
//   2. Call OpenRouter with tool definitions
//   3. If tool calls returned → execute → feed results back → repeat
//   4. If model errors → try next model in fallback chain → then Gemini
//   5. Yield streaming events to caller (SSE controller)

import {
    openRouterClient,
    OPENROUTER_MODEL,
    OPENROUTER_FALLBACK_MODELS,
    geminiClient,
    GEMINI_FALLBACK_MODEL,
    getActiveProvider,
} from './llm.client.js';
import {
    buildSystemPrompt,
    buildConversationHistory,
    buildToolDeclarations,
    oaiMessagesToGeminiContents,
    oaiToolsToGeminiFunctionDeclarations,
    type OAIMessage,
    type OAITool,
} from './context.builder.js';
import { toolRegistry } from '../tools/tool.registry.js';
import { executeTool } from '../tools/tool.executor.js';
import { addMessage } from '../chat/chat.service.js';
import { prisma } from '../../config/prisma.js';
import type { AgentStreamEvent, AgentLoopParams } from './agent.types.js';
import type OpenAI from 'openai';

const MAX_TOOL_ITERATIONS = 10;
const MAX_HISTORY_MESSAGES = 50;

// ─── Main entry point ────────────────────────────────────────────────────────

export async function* runAgentLoop(
    params: AgentLoopParams,
): AsyncGenerator<AgentStreamEvent> {
    const { workspaceId, userId, conversationId, userMessage } = params;

    try {
        // ── 1. Load workspace context ─────────────────────────────────────
        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, ownerId: userId },
            select: {
                name: true,
                integrations: {
                    select: { provider: true },
                },
            },
        });

        if (!workspace) {
            yield { type: 'error', message: 'Workspace not found' };
            return;
        }

        // ── 2. Get available tools ────────────────────────────────────────
        const availableTools = await toolRegistry.getAvailableForWorkspace(workspaceId);

        // ── 3. Load conversation history ──────────────────────────────────
        const dbMessages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            take: MAX_HISTORY_MESSAGES,
            select: {
                role: true,
                content: true,
                toolCalls: true,
            },
        });

        // ── 4. Build prompt components ────────────────────────────────────
        const systemPrompt = buildSystemPrompt(
            {
                workspaceName: workspace.name,
                connectedIntegrations: workspace.integrations.map((i: { provider: string }) => i.provider),
            },
            availableTools,
        );

        const history = buildConversationHistory(dbMessages);
        const toolDeclarations = buildToolDeclarations(availableTools);

        // ── 5. Determine provider and run the loop ────────────────────────
        const provider = getActiveProvider();

        let fullAssistantText = '';

        if (provider === 'openrouter') {
            yield* runOpenRouterLoop({
                systemPrompt,
                history,
                toolDeclarations,
                userMessage,
                userId,
                workspaceId,
                conversationId,
                fullAssistantTextRef: { value: fullAssistantText },
            });
            // read back from ref (generators can't return values easily)
        } else {
            yield* runGeminiLoop({
                systemPrompt,
                history,
                toolDeclarations,
                userMessage,
                userId,
                workspaceId,
                conversationId,
            });
        }

    } catch (error) {
        console.error('[AgentOrchestrator] Unhandled error:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        yield { type: 'error', message };
    }
}

// ─── OpenRouter loop (primary + cascadeable) ──────────────────────────────────

interface LoopParams {
    systemPrompt: string;
    history: OAIMessage[];
    toolDeclarations: OAITool[];
    userMessage: string;
    userId: string;
    workspaceId: string;
    conversationId: string;
    fullAssistantTextRef?: { value: string };
}

interface ModelLoopParams extends LoopParams {
    model: string;
}

// Primary entry — uses OPENROUTER_MODEL constant
async function* runOpenRouterLoop(params: LoopParams): AsyncGenerator<AgentStreamEvent> {
    yield* runOpenRouterLoopWithModel({ ...params, model: OPENROUTER_MODEL });
}

// Generic loop — used by both primary and fallback cascade
async function* runOpenRouterLoopWithModel(params: ModelLoopParams): AsyncGenerator<AgentStreamEvent> {
    const { model, systemPrompt, history, toolDeclarations, userMessage, userId, workspaceId, conversationId } = params;

    // Build the full message list: system + history + new user message
    const messages: OAIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage },
    ];

    let fullAssistantText = '';
    let iterations = 0;

    try {
        while (iterations < MAX_TOOL_ITERATIONS) {
            iterations++;

            const createParams: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
                model: model,
                messages,
                temperature: 0.7,
                max_tokens: 4096,
                ...(toolDeclarations.length > 0 ? { tools: toolDeclarations, tool_choice: 'auto' as const } : {}),
            };
            const response = await openRouterClient.chat.completions.create(createParams);

            const choice = response.choices[0];
            if (!choice) {
                yield { type: 'error', message: 'No response from AI' };
                return;
            }

            const assistantMsg = choice.message;

            // ── Handle text response ───────────────────────────────────────
            if (assistantMsg.content) {
                fullAssistantText += assistantMsg.content;
                yield { type: 'text', content: assistantMsg.content };
            }

            // ── Handle tool calls ──────────────────────────────────────────
            if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
                // Add assistant message (with tool_calls) to history
                messages.push({
                    role: 'assistant',
                    content: assistantMsg.content ?? null,
                    tool_calls: assistantMsg.tool_calls,
                });

                for (const tc of assistantMsg.tool_calls) {
                    if (tc.type !== 'function') continue;
                    const toolName = tc.function.name;
                    let toolArgs: Record<string, unknown> = {};
                    try {
                        toolArgs = JSON.parse(tc.function.arguments ?? '{}');
                    } catch {
                        toolArgs = {};
                    }

                    yield { type: 'tool_start', toolName, input: toolArgs };

                    const result = await executeTool(
                        toolName,
                        toolArgs,
                        { userId, workspaceId },
                        conversationId,
                    );

                    yield { type: 'tool_result', toolName, result };

                    // Persist tool call + result to DB
                    await prisma.message.create({
                        data: {
                            conversationId,
                            role: 'tool_call',
                            content: `Called ${toolName}`,
                            toolCalls: [{ id: tc.id, name: toolName, args: toolArgs }] as any,
                        },
                    });
                    await prisma.message.create({
                        data: {
                            conversationId,
                            role: 'tool_result',
                            content: result.success ? `${toolName} succeeded` : `${toolName} failed: ${result.error}`,
                            toolCalls: [{ id: tc.id, name: toolName, result: result as any }] as any,
                        },
                    });

                    // Feed result back into conversation
                    messages.push({
                        role: 'tool',
                        tool_call_id: tc.id,
                        content: result.success
                            ? JSON.stringify(result.data ?? {})
                            : JSON.stringify({ error: result.error }),
                    });
                }

                // Continue loop — model will process tool results
                continue;
            }

            // ── No tool calls → we're done ─────────────────────────────────
            break;
        }

        if (iterations >= MAX_TOOL_ITERATIONS) {
            const warning = '\n\n*[Reached maximum tool call limit]*';
            fullAssistantText += warning;
            yield { type: 'text', content: warning };
        }

        if (fullAssistantText) {
            await addMessage(conversationId, 'assistant', fullAssistantText);
        }

        yield { type: 'done', fullContent: fullAssistantText };

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[AgentOrchestrator] OpenRouter error (${OPENROUTER_MODEL}):`, errorMsg);

        // ── Cascade through free-model fallback chain ──────────────────────
        const allFallbacks = [...OPENROUTER_FALLBACK_MODELS];
        for (const fallbackModel of allFallbacks) {
            console.log(`[AgentOrchestrator] Trying fallback model: ${fallbackModel}`);
            try {
                yield* runOpenRouterLoopWithModel({
                    model: fallbackModel,
                    systemPrompt,
                    history,
                    toolDeclarations,
                    userMessage,
                    userId,
                    workspaceId,
                    conversationId,
                });
                return; // success — stop cascading
            } catch (fallbackError) {
                const fbMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                console.error(`[AgentOrchestrator] Fallback model ${fallbackModel} also failed:`, fbMsg);
            }
        }

        // ── All OpenRouter models failed → last resort: Gemini ─────────────
        console.warn('[AgentOrchestrator] All OpenRouter models failed — falling back to Gemini.');
        yield { type: 'text', content: '*[Switching to backup AI provider...]*\n\n' };
        const historyForGemini = messages.slice(1); // strip system message
        yield* runGeminiLoop({
            systemPrompt,
            history: historyForGemini,
            toolDeclarations,
            userMessage,
            userId,
            workspaceId,
            conversationId,
            isAlreadyAppended: true, // userMessage already in history
        });
    }
}

// ─── Gemini loop (fallback) ──────────────────────────────────────────────────

import type { Content, Part } from '@google/genai';

interface GeminiLoopParams extends Omit<LoopParams, 'fullAssistantTextRef'> {
    isAlreadyAppended?: boolean; // true when called from fallback (userMessage already in history)
}

async function* runGeminiLoop(params: GeminiLoopParams): AsyncGenerator<AgentStreamEvent> {
    const { systemPrompt, history, toolDeclarations, userMessage, userId, workspaceId, conversationId, isAlreadyAppended } = params;

    const geminiHistory = oaiMessagesToGeminiContents(history);
    const geminiTools = oaiToolsToGeminiFunctionDeclarations(toolDeclarations);

    const contents: Content[] = [
        ...geminiHistory,
        ...(isAlreadyAppended ? [] : [{ role: 'user' as const, parts: [{ text: userMessage }] }]),
    ];

    let fullAssistantText = '';
    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
        iterations++;

        const response = await geminiClient.models.generateContent({
            model: GEMINI_FALLBACK_MODEL,
            contents,
            config: {
                systemInstruction: systemPrompt,
                ...(geminiTools.length > 0 ? { tools: [{ functionDeclarations: geminiTools }] } : {}),
                temperature: 0.7,
                maxOutputTokens: 4096,
            },
        });

        const candidate = response.candidates?.[0];
        if (!candidate?.content?.parts) {
            yield { type: 'error', message: 'No response from Gemini fallback' };
            return;
        }

        const parts = candidate.content.parts;
        const functionCalls = parts.filter(p => p.functionCall);
        const textParts = parts.filter(p => p.text);

        if (textParts.length > 0) {
            const text = textParts.map(p => p.text ?? '').join('');
            if (text) {
                fullAssistantText += text;
                yield { type: 'text', content: text };
            }
        }

        if (functionCalls.length > 0) {
            contents.push({ role: 'model', parts });

            const functionResponseParts: Part[] = [];

            for (const part of functionCalls) {
                const fc = part.functionCall!;
                const toolName = fc.name!;
                const toolArgs = (fc.args ?? {}) as Record<string, unknown>;

                yield { type: 'tool_start', toolName, input: toolArgs };

                const result = await executeTool(
                    toolName,
                    toolArgs,
                    { userId, workspaceId },
                    conversationId,
                );

                yield { type: 'tool_result', toolName, result };

                await prisma.message.create({
                    data: {
                        conversationId,
                        role: 'tool_call',
                        content: `Called ${toolName}`,
                        toolCalls: [{ name: toolName, args: toolArgs }] as any,
                    },
                });
                await prisma.message.create({
                    data: {
                        conversationId,
                        role: 'tool_result',
                        content: result.success ? `${toolName} succeeded` : `${toolName} failed: ${result.error}`,
                        toolCalls: [{ name: toolName, result: result as any }] as any,
                    },
                });

                functionResponseParts.push({
                    functionResponse: {
                        name: toolName,
                        response: {
                            success: result.success,
                            data: result.data ?? null,
                            error: result.error ?? null,
                        },
                    },
                });
            }

            contents.push({ role: 'user', parts: functionResponseParts });
            continue;
        }

        break;
    }

    if (iterations >= MAX_TOOL_ITERATIONS) {
        const warning = '\n\n*[Reached maximum tool call limit]*';
        fullAssistantText += warning;
        yield { type: 'text', content: warning };
    }

    if (fullAssistantText) {
        await addMessage(conversationId, 'assistant', fullAssistantText);
    }

    yield { type: 'done', fullContent: fullAssistantText };
}
