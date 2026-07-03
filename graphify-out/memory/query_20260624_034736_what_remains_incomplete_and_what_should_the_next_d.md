---
type: "query"
date: "2026-06-24T03:47:36.978486+00:00"
question: "What remains incomplete and what should the next development milestones be?"
contributor: "graphify"
source_nodes: ["AI Worker — Backend Implementation Plan", "useWorkspace()", "Phase 5 — Chat System & AI Agent (Core Loop)", "Phase 9 — Audit Logs, Security & Rate Limiting"]
---

# Q: What remains incomplete and what should the next development milestones be?

## Answer

Implemented: basic auth, owner-only workspaces, GitHub OAuth/profile/repos, and dashboard scaffolding. Immediate blockers: exposed local credentials need rotation, OAuth tokens are stored plaintext, permissive CORS and fallback JWT secret, missing tests and CI coverage, failing web lint, incomplete workspace membership model, and mock-only chat agents and workflows. Next milestone should harden the existing vertical slice before implementing persistent chat and the AI agent loop.

## Source Nodes

- AI Worker — Backend Implementation Plan
- useWorkspace()
- Phase 5 — Chat System & AI Agent (Core Loop)
- Phase 9 — Audit Logs, Security & Rate Limiting