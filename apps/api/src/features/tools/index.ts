// ─── Tool System Bootstrap ──────────────────────────────────────────────────
//
// Called once at server startup to register all available tools.

import { toolRegistry } from './tool.registry.js';
import { allGitHubTools } from './github/github.tools.js';
import { allGoogleTools } from './google/google.tools.js';

export function registerAllTools(): void {
    console.log('[Tools] Registering all tools...');

    // Register GitHub tools
    for (const tool of allGitHubTools) {
        toolRegistry.register(tool);
    }

    // Register Google tools (Gmail + Calendar)
    for (const tool of allGoogleTools) {
        toolRegistry.register(tool);
    }

    console.log(`[Tools] ${toolRegistry.getAll().length} tools registered.`);
}
