// ─── Context Builder ─────────────────────────────────────────────────────────
//
// Builds the system prompt and conversation history in OpenAI-compatible format.
// Used by both the OpenRouter primary path and Gemini fallback (via conversion).

import type { Tool } from '../tools/tool.types.js';
import type OpenAI from 'openai';

// ─── Types ──────────────────────────────────────────────────────────────────

export type OAIMessage = OpenAI.Chat.ChatCompletionMessageParam;
export type OAITool = OpenAI.Chat.ChatCompletionTool;

// ─── System Prompt Builder ──────────────────────────────────────────────────

interface WorkspaceContext {
    workspaceName: string;
    connectedIntegrations: string[];
}

export function buildSystemPrompt(
    workspace: WorkspaceContext,
    availableTools: Tool[],
): string {
    const integrationList = workspace.connectedIntegrations.length > 0
        ? workspace.connectedIntegrations.map(i => `  • ${i}`).join('\n')
        : '  (none connected)';

    const toolDescriptions = availableTools.length > 0
        ? availableTools.map(t => {
            const params = t.definition.parameters
                .map(p => `    - ${p.name} (${p.type}${p.required ? ', required' : ', optional'}): ${p.description}`)
                .join('\n');
            return `  • ${t.definition.name}: ${t.definition.description}\n${params}`;
        }).join('\n\n')
        : '  (no tools available — ask the user to connect integrations)';

    return `You are TaskMind, an AI work assistant operating inside the workspace "${workspace.workspaceName}".

## Your Role
You help users accomplish work tasks by using the tools available to you. You can read code, search repositories, create issues, and more — depending on which integrations are connected.

## Connected Integrations
${integrationList}

## Available Tools
When the user asks you to do something that requires interacting with a connected service, use the appropriate tool. Don't just describe what you would do — actually use the tool.

${toolDescriptions}

## Guidelines
1. **Be concise and direct.** Answer questions clearly without unnecessary preamble.
2. **Use tools proactively.** If the user asks about their repositories, code, or issues — use the tools to get real data.
3. **Show your work.** When you use a tool, briefly mention what you're doing (e.g., "Let me check your repos...").
4. **Handle errors gracefully.** If a tool fails, explain what happened and suggest alternatives.
5. **Format responses nicely.** Use markdown for code blocks, lists, and emphasis where appropriate.
6. **Stay in scope.** You're a work assistant. If asked about something outside your capabilities, say so politely.
7. **Don't make up data.** If you don't have information and can't get it via a tool, say so.`;
}

// ─── Conversation History Builder ───────────────────────────────────────────

interface DbMessage {
    role: string;
    content: string;
    toolCalls: unknown;
}

export function buildConversationHistory(messages: DbMessage[]): OAIMessage[] {
    const result: OAIMessage[] = [];

    for (const msg of messages) {
        if (msg.role === 'user') {
            result.push({ role: 'user', content: msg.content });

        } else if (msg.role === 'assistant') {
            result.push({ role: 'assistant', content: msg.content });

        } else if (msg.role === 'tool_call') {
            // Model message that triggered tool calls
            const toolCalls = msg.toolCalls as Array<{ name: string; args: Record<string, unknown>; id?: string }> | null;
            if (toolCalls && toolCalls.length > 0) {
                result.push({
                    role: 'assistant',
                    content: null,
                    tool_calls: toolCalls.map((tc, idx) => ({
                        id: tc.id ?? `call_${idx}`,
                        type: 'function' as const,
                        function: {
                            name: tc.name,
                            arguments: JSON.stringify(tc.args),
                        },
                    })),
                });
            }

        } else if (msg.role === 'tool_result') {
            // Tool result messages
            const toolCalls = msg.toolCalls as Array<{ name: string; result: unknown; id?: string }> | null;
            if (toolCalls && toolCalls.length > 0) {
                for (const [idx, tc] of toolCalls.entries()) {
                    result.push({
                        role: 'tool',
                        tool_call_id: tc.id ?? `call_${idx}`,
                        content: typeof tc.result === 'string'
                            ? tc.result
                            : JSON.stringify(tc.result),
                    });
                }
            }
        }
    }

    return result;
}

// ─── Tool Declarations Builder (OpenAI format) ───────────────────────────────

function mapTypeToJsonSchema(type: string): string {
    switch (type) {
        case 'string': return 'string';
        case 'number': return 'number';
        case 'boolean': return 'boolean';
        case 'object': return 'object';
        case 'array': return 'array';
        default: return 'string';
    }
}

export function buildToolDeclarations(tools: Tool[]): OAITool[] {
    return tools.map(tool => {
        const properties: Record<string, object> = {};
        const required: string[] = [];

        for (const param of tool.definition.parameters) {
            const prop: Record<string, unknown> = {
                type: mapTypeToJsonSchema(param.type),
                description: param.description,
            };

            if (param.enum) {
                prop['enum'] = param.enum;
            }

            if (param.type === 'array') {
                prop['items'] = { type: 'string' };
            }

            properties[param.name] = prop;

            if (param.required) {
                required.push(param.name);
            }
        }

        return {
            type: 'function' as const,
            function: {
                name: tool.definition.name,
                description: tool.definition.description,
                parameters: {
                    type: 'object',
                    properties,
                    ...(required.length > 0 ? { required } : {}),
                },
            },
        };
    });
}

// ─── Gemini-format converters (used by the fallback path) ────────────────────
// These live here so the orchestrator can use them when OpenRouter fails.

import type { Content, Part, FunctionDeclaration, Schema } from '@google/genai';

export function oaiMessagesToGeminiContents(messages: OAIMessage[]): Content[] {
    const contents: Content[] = [];

    for (const msg of messages) {
        if (msg.role === 'user' && typeof msg.content === 'string') {
            contents.push({ role: 'user', parts: [{ text: msg.content }] });

        } else if (msg.role === 'assistant') {
            if (typeof msg.content === 'string' && msg.content) {
                contents.push({ role: 'model', parts: [{ text: msg.content }] });
            } else if ('tool_calls' in msg && msg.tool_calls) {
                const parts: Part[] = msg.tool_calls
                    .filter(tc => tc.type === 'function')
                    .map(tc => ({
                        functionCall: {
                            name: (tc as any).function.name,
                            args: JSON.parse((tc as any).function.arguments ?? '{}'),
                        },
                    }));
                contents.push({ role: 'model', parts });
            }

        } else if (msg.role === 'tool') {
            contents.push({
                role: 'user',
                parts: [{
                    functionResponse: {
                        name: (msg as any).name ?? 'unknown',
                        response: { result: msg.content },
                    },
                }],
            });
        }
    }

    return contents;
}

export function oaiToolsToGeminiFunctionDeclarations(tools: OAITool[]): FunctionDeclaration[] {
    return tools
        .filter(tool => tool.type === 'function')
        .map(tool => {
        const fn = (tool as any).function;
        const params = fn.parameters as any;
        const properties: Record<string, Schema> = {};
        const required: string[] = params?.required ?? [];

        for (const [key, val] of Object.entries<any>(params?.properties ?? {})) {
            const geminiType = val.type?.toUpperCase() ?? 'STRING';
            const prop: Schema = {
                type: geminiType as any,
                description: val.description ?? '',
            };
            if (val.enum) prop.enum = val.enum;
            if (val.type === 'array') prop.items = { type: 'STRING' as any };
            properties[key] = prop;
        }

        return {
            name: fn.name,
            description: fn.description ?? '',
            parameters: {
                type: 'OBJECT' as any,
                properties,
                ...(required.length > 0 ? { required } : {}),
            },
        };
    });
}
