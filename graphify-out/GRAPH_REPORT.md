# Graph Report - ai-worker  (2026-06-28)

## Corpus Check
- 92 files · ~104,706 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1421 nodes · 1659 edges · 68 communities (56 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ab654f21`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]

## God Nodes (most connected - your core abstractions)
1. `useWorkspace()` - 18 edges
2. `AI Worker — Backend Implementation Plan` - 16 edges
3. `prisma` - 12 edges
4. `AI Worker — Backend Architecture Blueprint` - 12 edges
5. `Phase 5 — Chat System & AI Agent (Core Loop)` - 11 edges
6. `ToolRegistry` - 9 edges
7. `Phase 0 — Project Foundation & Infrastructure` - 9 edges
8. `Phase 4 — Tool System Architecture` - 9 edges
9. `Phase 7 — Workflow Engine` - 9 edges
10. `7.2 Endpoints` - 9 edges

## Surprising Connections (you probably didn't know these)
- `DashboardOverview()` --calls--> `useWorkspace()`  [EXTRACTED]
  apps/web/src/app/(dashboard)/dashboard/page.tsx → apps/web/src/context/workspace-context.tsx
- `main()` --calls--> `registerAllTools()`  [EXTRACTED]
  apps/api/src/index.ts → apps/api/src/features/tools/index.ts
- `createConversationHandler()` --calls--> `createConversation()`  [EXTRACTED]
  apps/api/src/features/chat/chat.controller.ts → apps/api/src/features/chat/chat.service.ts
- `getConversationsHandler()` --calls--> `getConversations()`  [EXTRACTED]
  apps/api/src/features/chat/chat.controller.ts → apps/api/src/features/chat/chat.service.ts
- `getConversationHandler()` --calls--> `getConversationById()`  [EXTRACTED]
  apps/api/src/features/chat/chat.controller.ts → apps/api/src/features/chat/chat.service.ts

## Communities (68 total, 12 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (112): AggregateWorkspace, GetWorkspaceAggregateType, GetWorkspaceGroupByPayload, Prisma__WorkspaceClient, Workspace$conversationsArgs, Workspace$integrationsArgs, Workspace$memoriesArgs, WorkspaceAggregateArgs (+104 more)

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (108): Args, At, AtLeast, AtLoose, AtStrict, BatchPayload, Boolean, Bytes (+100 more)

### Community 2 - "Community 2"
Cohesion: 0.02
Nodes (102): AggregateConversation, Conversation$messagesArgs, Conversation$toolExecutionsArgs, ConversationAggregateArgs, ConversationCountAggregateInputType, ConversationCountAggregateOutputType, ConversationCountArgs, ConversationCountOrderByAggregateInput (+94 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (55): contents, functionCalls, functionResponseParts, history, systemPrompt, text, textParts, toolArgs (+47 more)

### Community 4 - "Community 4"
Cohesion: 0.03
Nodes (76): AggregateToolExecution, GetToolExecutionAggregateType, GetToolExecutionGroupByPayload, Prisma__ToolExecutionClient, ToolExecution$conversationArgs, ToolExecutionAggregateArgs, ToolExecutionCountAggregateInputType, ToolExecutionCountAggregateOutputType (+68 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (75): AggregateIntegration, GetIntegrationAggregateType, GetIntegrationGroupByPayload, IntegrationAggregateArgs, IntegrationCountAggregateInputType, IntegrationCountAggregateOutputType, IntegrationCountArgs, IntegrationCountOrderByAggregateInput (+67 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (75): AggregateMemory, GetMemoryAggregateType, GetMemoryGroupByPayload, MemoryAggregateArgs, MemoryCountAggregateInputType, MemoryCountAggregateOutputType, MemoryCountArgs, MemoryCountOrderByAggregateInput (+67 more)

### Community 7 - "Community 7"
Cohesion: 0.03
Nodes (75): AggregateMessage, GetMessageAggregateType, GetMessageGroupByPayload, MessageAggregateArgs, MessageCountAggregateInputType, MessageCountAggregateOutputType, MessageCountArgs, MessageCountOrderByAggregateInput (+67 more)

### Community 8 - "Community 8"
Cohesion: 0.03
Nodes (75): AggregateUser, DateTimeFieldUpdateOperationsInput, GetUserAggregateType, GetUserGroupByPayload, NullableStringFieldUpdateOperationsInput, Prisma__UserClient, StringFieldUpdateOperationsInput, User$workspacesArgs (+67 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (36): MessageBubble(), MessageBubbleProps, renderMarkdown(), ChatPage(), ConversationItem(), formatRelative(), formatToolName(), safeJson() (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (37): connectGitHubHandler(), disconnectGitHubHandler(), getAuthenticatedUserId(), getGitHubProfileHandler(), getGitHubReposHandler(), getGitHubStatusHandler(), getRequestCallbackUrl(), getStringQueryParam() (+29 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (29): Conversation, Integration, Memory, Message, PrismaClient, ToolExecution, User, Workspace (+21 more)

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (30): 0.1 Install Core Dependencies, 0.2 Configure TypeScript, 0.3 Create Config Module, 0.4 Create Express App Bootstrap, 0.5 Create Shared Utilities, 0.6 Create Database Migrations, 0.7 Update package.json Scripts, 0.8 Verification Checklist (+22 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (25): 5.10 Verification Checklist, 5.1 Database — Conversations, Messages, Agent Memory, 5.2 Chat Module, 5.3 Agent System, 5.4 Install Gemini SDK, 5.5 System Prompt Design, 5.6 Context Builder — Execution Steps, 5.7 Agent Orchestrator — Core Loop (+17 more)

### Community 14 - "Community 14"
Cohesion: 0.16
Nodes (18): isAuthenticated(), authErrorMessages, getErrorMessage(), getProfileHandler(), loginHandler(), signupHandler(), UserRouter, getProfile() (+10 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (22): ConversationScalarFieldEnum, IntegrationScalarFieldEnum, JsonNullValueFilter, MemoryScalarFieldEnum, MessageScalarFieldEnum, ModelName, NullableJsonNullValueInput, NullsOrder (+14 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (14): AuthContentProps, AuthUI(), AuthUIProps, Button, ButtonProps, buttonVariants, defaultSignInContent, defaultSignUpContent (+6 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (22): Apps and Packages, Build, code:sh (npx create-turbo@latest), code:sh (cd my-turborepo), code:sh (cd my-turborepo), code:sh (turbo link), code:sh (npx turbo link), code:sh (cd my-turborepo) (+14 more)

### Community 18 - "Community 18"
Cohesion: 0.1
Nodes (21): 4.1 Tool Core Framework, 4.2 Core Interfaces — Implementation Details, 4.3 Gmail Tool — Implementation Details, 4.4 Notion Tool — Implementation Details, 4.5 GitHub, Vercel, Render Tools — Stub Implementation, 4.6 Tool Registration at Startup, 4.7 Database — Tool Executions Table, 4.8 Verification Checklist (+13 more)

### Community 19 - "Community 19"
Cohesion: 0.26
Nodes (17): createWorkspaceHandler(), deleteWorkspaceHandler(), getAuthenticatedUserId(), getErrorMessage(), getWorkspaceByIdHandler(), getWorkspaceId(), getWorkspacesHandler(), updateWorkspaceHandler() (+9 more)

### Community 20 - "Community 20"
Cohesion: 0.1
Nodes (20): 3.1 Database — Integrations & OAuth Tokens, 3.2 Integrations Module, 3.3 Integration Health Check, 3.4 Verification Checklist, code:sql (-- integrations table), code:block36 (apps/api/src/modules/integrations/), code:block37 (Step 1: Frontend calls GET /api/v1/integrations/:provider/co), code:block38 (- generateAuthUrl(provider: string, workspaceId: string): { ) (+12 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (19): 1.1 Database — Users Table, 1.2 Auth Module, 1.3 Users Module, 1.4 Wire Up Routes, 1.5 Verification Checklist, `auth.middleware.ts` — Execution steps:, `auth.service.ts` — Execution steps:, code:sql (-- users table (see architecture doc for full schema)) (+11 more)

### Community 22 - "Community 22"
Cohesion: 0.12
Nodes (17): 7.1 Database — Workflows & Workflow Runs, 7.2 Workflow Module, 7.3 Workflow Engine — Execution Steps, 7.4 Template Resolver, 7.5 Workflow Scheduler, 7.6 API Endpoints, 7.7 Example Workflow Creation Request, 7.8 Verification Checklist (+9 more)

### Community 23 - "Community 23"
Cohesion: 0.12
Nodes (17): 10.1 Billing Module (Stripe-Ready Stubs), 10.2 Health & Monitoring Endpoints, 10.3 Error Tracking, 10.4 Graceful Shutdown, 10.5 Dockerfile, 10.6 Environment Template, 10.7 Verification Checklist, code:block100 (Handle SIGTERM / SIGINT:) (+9 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (16): 6.1 Install BullMQ, 6.2 Queue Configuration, 6.3 Agent Worker — Execution Steps, 6.4 Refactor Chat to Use Queue, 6.5 Job Dashboard (Optional), 6.6 Verification Checklist, code:bash (pnpm add bullmq), code:block68 (apps/api/src/jobs/) (+8 more)

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (15): 2.1 Database — Workspaces & Memberships, 2.2 Workspaces Module, 2.3 Auto-Create Workspace on Signup, 2.4 Wire Up Routes, 2.5 Verification Checklist, code:sql (-- workspaces table), code:block29 (apps/api/src/modules/workspaces/), code:block30 (- create(ownerId: string, data: CreateWorkspaceDto): Workspa) (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (15): 3.1 Users & Workspaces, 3.2 Integrations & OAuth, 3.3 Conversations & Messages, 3.4 Workflows & Execution, 3.5 Automations, 3.6 Audit Logs & Memory, 3. Database Design, code:sql (-- ═════════════════════════════════════════════════════════) (+7 more)

### Community 27 - "Community 27"
Cohesion: 0.17
Nodes (12): 8.1 Database — Automations Table, 8.2 Automations Module, 8.3 Automation Scheduler, 8.4 API Endpoints, 8.5 Verification Checklist, `automations.service.ts` — Methods:, code:block83 (apps/api/src/modules/automations/), code:block84 (- create(workspaceId, data: CreateAutomationDto): Automation) (+4 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (12): 7.1 Base URL & Conventions, 7.2 Endpoints, 7. API Design, Admin & Audit (`/api/v1/admin`), Auth (`/api/v1/auth`), Automations (`/api/v1/automations`), Chat (`/api/v1/chat`), code:block21 (Base:       /api/v1) (+4 more)

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (11): 9.1 OAuth Token Encryption, 9.2 RBAC (Role-Based Access Control), 9.3 Workspace Isolation, 9.4 Secrets Management, 9.5 Rate Limiting, 9. Security Design, code:typescript (// shared/utils/crypto.ts), code:typescript (// Three roles per workspace) (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.2
Nodes (10): 9.2 RBAC Enforcement, 9.3 Rate Limiting, 9.4 Security Hardening, 9.5 Verification Checklist, code:block90 (Define permission sets per role:), code:bash (pnpm add rate-limiter-flexible), code:block92 (Three rate limiters (Redis-backed):), code:block93 (1. Helmet.js — already added in Phase 0) (+2 more)

### Community 31 - "Community 31"
Cohesion: 0.2
Nodes (9): AI Worker — Backend Implementation Plan, code:block1 (Phase 0 — Project Foundation & Infrastructure          (Days), code:block104 (apps/api/src/), code:bash (# Phase 0 — Foundation), code:mermaid (gantt), Dependency Installation Summary, Final File Count Summary, Overview (+1 more)

### Community 32 - "Community 32"
Cohesion: 0.2
Nodes (10): 5.1 Core Interfaces, 5.2 Tool Registry, 5.3 Tool Executor (with retry + permission check), 5.4 Example Tool: Gmail, 5.5 How Each Provider Plugs In, 5. Tool System Architecture, code:typescript (// tools/tool.types.ts), code:typescript (// tools/tool.registry.ts) (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (7): geistMono, geistSans, inter, jetbrainsMono, metadata, RootLayout(), sora

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (9): 6.1 Workflow Definition Schema, 6.2 Workflow Engine Runtime, 6.3 Engine Core Logic, 6.4 Example Workflow: Daily Email Summary → Notion, 6. Workflow Engine, code:typescript (interface WorkflowDefinition {), code:mermaid (flowchart TB), code:typescript (// modules/workflows/engine/workflow-engine.ts) (+1 more)

### Community 35 - "Community 35"
Cohesion: 0.39
Nodes (4): config, nextJsConfig, config, config

### Community 36 - "Community 36"
Cohesion: 0.25
Nodes (8): 8.1 Queue Definitions, 8.2 Queue Separation Strategy, 8.3 Worker Example, 8.4 Job Types, 8. BullMQ Queue Architecture, code:typescript (// jobs/queue.config.ts), code:typescript (// jobs/workers/agent.worker.ts), code:typescript (// Agent job)

### Community 37 - "Community 37"
Cohesion: 0.25
Nodes (8): 4.1 Component Diagram, 4.2 Component Responsibilities, 4.3 Walkthrough: "Create tasks from customer emails and update Notion", 4.4 Agent Loop Pseudocode, 4. Agent Architecture, code:mermaid (flowchart TB), code:mermaid (sequenceDiagram), code:typescript (// agent.orchestrator.ts)

### Community 38 - "Community 38"
Cohesion: 0.25
Nodes (7): 1. High-Level Architecture Diagram, 2. Backend Folder Structure, AI Worker — Backend Architecture Blueprint, code:mermaid (graph TB), code:block2 (apps/api/), Data Flow Summary, Open Questions

### Community 39 - "Community 39"
Cohesion: 0.29
Nodes (4): config, LogOptions, PrismaClient, PrismaClientConstructor

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (7): 10. MVP vs Future Architecture, code:mermaid (flowchart LR), code:block31 (Month 1-3:  MVP — Core chat + Gmail + Notion), Migration Path (MVP → Scale), MVP Feature Breakdown, MVP — Months 1–3, Scale Architecture — 100K Users

### Community 41 - "Community 41"
Cohesion: 0.4
Nodes (4): code:bash (npm run dev), Deploy on Vercel, Getting Started, Learn More

### Community 44 - "Community 44"
Cohesion: 0.5
Nodes (4): 9.1 Audit Logs, `audit.service.ts` — Implementation:, code:block88 (apps/api/src/modules/audit/), code:block89 (log(event: AuditEvent):)

### Community 45 - "Community 45"
Cohesion: 0.5
Nodes (3): Answer, Q: What remains incomplete and what should the next development milestones be?, Source Nodes

### Community 46 - "Community 46"
Cohesion: 0.5
Nodes (3): Answer, Q: Which defects can be fixed now in the current implementation?, Source Nodes

## Knowledge Gaps
- **1001 isolated node(s):** `app`, `adapter`, `systemPrompt`, `history`, `toolDeclarations` (+996 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AI Worker — Backend Implementation Plan` connect `Community 31` to `Community 12`, `Community 13`, `Community 18`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 25`, `Community 27`, `Community 30`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `Phase 4 — Tool System Architecture` connect `Community 18` to `Community 31`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `Phase 3 — OAuth Integration Framework` connect `Community 20` to `Community 31`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `app`, `adapter`, `systemPrompt` to the rest of the system?**
  _1001 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._