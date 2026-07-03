// ─── LLM Client ──────────────────────────────────────────────────────────────
//
// Primary: OpenRouter (any model via OpenAI-compatible API)
// Fallback: Google Gemini via @google/genai
//
// Free models with verified tool-calling support (as of 2026-07):
//   nvidia/nemotron-3-super-120b-a12b:free   — 120B, 1M ctx, structured_outputs ✓
//   qwen/qwen3-coder:free                     — 480B, 1M ctx, great for code tasks
//   openai/gpt-oss-120b:free                  — 120B, 131K ctx
//   meta-llama/llama-3.3-70b-instruct:free   — 70B, 131K ctx, battle-tested
//   nvidia/nemotron-3-ultra-550b-a55b:free   — 550B, 1M ctx

import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { OPENROUTER_API_KEY, GEMINI_API_KEY } from '../../config/config.js';

// ─── Primary: OpenRouter ────────────────────────────────────────────────────

if (!OPENROUTER_API_KEY) {
    console.warn('[LLM] OPENROUTER_API_KEY is not set — will fall back to Gemini.');
}

export const openRouterClient = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: OPENROUTER_API_KEY,
    defaultHeaders: {
        'HTTP-Referer': 'https://github.com/ai-worker',
        'X-Title': 'AI Worker',
    },
});

/**
 * Primary model — best free model with tool calling + structured outputs + 1M context.
 * Change this to swap models without touching any other file.
 */
export const OPENROUTER_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

/**
 * Ordered fallback chain used if the primary model is unavailable or rate-limited.
 * The orchestrator will try each in sequence before giving up on OpenRouter entirely.
 */
export const OPENROUTER_FALLBACK_MODELS = [
    'qwen/qwen3-coder:free',                   // 480B, 1M ctx — great for code
    'openai/gpt-oss-120b:free',                // 120B, 131K ctx
    'meta-llama/llama-3.3-70b-instruct:free',  // 70B, 131K ctx — most reliable
] as const;

// ─── Fallback: Gemini ───────────────────────────────────────────────────────

if (!GEMINI_API_KEY) {
    console.warn('[LLM] GEMINI_API_KEY is not set — Gemini fallback will not work.');
}

export const geminiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
export const GEMINI_FALLBACK_MODEL = 'gemini-2.0-flash';

// ─── Provider selector ──────────────────────────────────────────────────────

export type LLMProvider = 'openrouter' | 'gemini';

export function getActiveProvider(): LLMProvider {
    if (OPENROUTER_API_KEY) return 'openrouter';
    if (GEMINI_API_KEY) return 'gemini';
    throw new Error('[LLM] No AI provider configured. Set OPENROUTER_API_KEY or GEMINI_API_KEY.');
}
