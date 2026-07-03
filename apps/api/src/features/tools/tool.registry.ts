// ─── Tool Registry ──────────────────────────────────────────────────────────
//
// Singleton that holds all registered tools and provides lookup methods.
// Tools register themselves at server startup via registerAllTools().

import type { Tool, ToolDefinition } from './tool.types.js';
import { prisma } from '../../config/prisma.js';

class ToolRegistry {
    private tools: Map<string, Tool> = new Map();

    register(tool: Tool): void {
        if (this.tools.has(tool.definition.name)) {
            console.warn(`Tool "${tool.definition.name}" is already registered — overwriting.`);
        }
        this.tools.set(tool.definition.name, tool);
        console.log(`[ToolRegistry] Registered tool: ${tool.definition.name}`);
    }

    get(name: string): Tool | undefined {
        return this.tools.get(name);
    }

    getAll(): Tool[] {
        return Array.from(this.tools.values());
    }

    /**
     * Returns tools that are available for a given workspace.
     * A tool is available if:
     *   - It has no `requiresIntegration`, OR
     *   - The workspace has the required integration connected.
     */
    async getAvailableForWorkspace(workspaceId: string): Promise<Tool[]> {
        const integrations = await prisma.integration.findMany({
            where: { workspaceId },
            select: { provider: true },
        });

        const connectedProviders = new Set(integrations.map((i: { provider: string }) => i.provider));

        return this.getAll().filter(tool => {
            const required = tool.definition.requiresIntegration;
            if (!required) return true;
            return connectedProviders.has(required);
        });
    }

    /**
     * Convert ToolDefinition[] into the Gemini FunctionDeclaration[] format.
     */
    static toGeminiFunctionDeclarations(tools: Tool[]): GeminiFunctionDeclaration[] {
        return tools.map(tool => {
            const properties: Record<string, GeminiPropertySchema> = {};
            const required: string[] = [];

            for (const param of tool.definition.parameters) {
                const prop: GeminiPropertySchema = {
                    type: mapTypeToGemini(param.type),
                    description: param.description,
                };

                if (param.enum) {
                    prop.enum = param.enum;
                }

                properties[param.name] = prop;

                if (param.required) {
                    required.push(param.name);
                }
            }

            const parameters: {
                type: 'OBJECT';
                properties: Record<string, GeminiPropertySchema>;
                required?: string[];
            } = {
                type: 'OBJECT',
                properties,
            };
            if (required.length > 0) {
                parameters.required = required;
            }

            return {
                name: tool.definition.name,
                description: tool.definition.description,
                parameters,
            };
        });
    }
}

// ─── Gemini Schema Helpers ──────────────────────────────────────────────────

interface GeminiPropertySchema {
    type: string;
    description: string;
    enum?: string[];
    items?: { type: string };
}

interface GeminiFunctionDeclaration {
    name: string;
    description: string;
    parameters: {
        type: 'OBJECT';
        properties: Record<string, GeminiPropertySchema>;
        required?: string[];
    };
}

function mapTypeToGemini(type: string): string {
    switch (type) {
        case 'string': return 'STRING';
        case 'number': return 'NUMBER';
        case 'boolean': return 'BOOLEAN';
        case 'object': return 'OBJECT';
        case 'array': return 'ARRAY';
        default: return 'STRING';
    }
}

// ─── Singleton Export ───────────────────────────────────────────────────────

export const toolRegistry = new ToolRegistry();
export { ToolRegistry };
