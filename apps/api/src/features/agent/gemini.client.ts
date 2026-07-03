// ─── Gemini Client (legacy re-export) ────────────────────────────────────────
//
// Kept for backward compatibility. All AI logic now lives in llm.client.ts.
// The orchestrator uses llm.client.ts directly.

export { geminiClient as genai, GEMINI_FALLBACK_MODEL as GEMINI_MODEL } from './llm.client.js';
