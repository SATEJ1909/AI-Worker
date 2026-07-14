// ─── GitHub Webhook Handler ─────────────────────────────────────────────────
//
// Receives GitHub webhook events, verifies the HMAC-SHA256 signature, and
// dispatches to appropriate handlers. Events are logged to the database for
// auditing and can be used to trigger agent workflows.

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request, RequestHandler, Response } from 'express';
import { prisma } from '../../../config/prisma.js';
import type { GitHubWebhookEventType, GitHubWebhookPayload } from './github.webhook.types.js';

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

// ─── Signature verification ─────────────────────────────────────────────────

function verifyWebhookSignature(payload: string, signatureHeader: string | undefined): boolean {
    if (!GITHUB_WEBHOOK_SECRET) {
        console.warn('[Webhook] GITHUB_WEBHOOK_SECRET not set — skipping signature check');
        return true; // Allow in development without secret
    }

    if (!signatureHeader) {
        return false;
    }

    const expectedSig = 'sha256=' + createHmac('sha256', GITHUB_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

    try {
        return timingSafeEqual(
            Buffer.from(signatureHeader),
            Buffer.from(expectedSig),
        );
    } catch {
        return false;
    }
}

// ─── Event handlers ─────────────────────────────────────────────────────────

async function handlePushEvent(payload: GitHubWebhookPayload) {
    const repoName = payload.repository?.full_name ?? 'unknown';
    const branch = payload.ref?.replace('refs/heads/', '') ?? 'unknown';
    const commitCount = payload.commits?.length ?? 0;

    console.log(
        `[Webhook:push] ${repoName} — ${commitCount} commit(s) pushed to ${branch}`,
    );

    return {
        event: 'push' as const,
        repository: repoName,
        branch,
        commitCount,
        commits: (payload.commits ?? []).slice(0, 10).map(c => ({
            id: c.id,
            message: c.message,
            author: c.author.name,
            timestamp: c.timestamp,
        })),
    };
}

async function handlePullRequestEvent(payload: GitHubWebhookPayload) {
    const pr = payload.pull_request;
    const repoName = payload.repository?.full_name ?? 'unknown';
    const action = payload.action ?? 'unknown';

    console.log(
        `[Webhook:pull_request] ${repoName} — PR #${pr?.number} ${action}: ${pr?.title}`,
    );

    return {
        event: 'pull_request' as const,
        action,
        repository: repoName,
        number: pr?.number,
        title: pr?.title,
        state: pr?.state,
        htmlUrl: pr?.html_url,
        head: pr?.head.ref,
        base: pr?.base.ref,
        user: pr?.user.login,
    };
}

async function handleIssuesEvent(payload: GitHubWebhookPayload) {
    const issue = payload.issue;
    const repoName = payload.repository?.full_name ?? 'unknown';
    const action = payload.action ?? 'unknown';

    console.log(
        `[Webhook:issues] ${repoName} — Issue #${issue?.number} ${action}: ${issue?.title}`,
    );

    return {
        event: 'issues' as const,
        action,
        repository: repoName,
        number: issue?.number,
        title: issue?.title,
        state: issue?.state,
        htmlUrl: issue?.html_url,
        user: issue?.user.login,
        labels: issue?.labels.map(l => l.name) ?? [],
    };
}

// ─── Persist event to database ──────────────────────────────────────────────

async function persistWebhookEvent(
    event: string,
    action: string | undefined,
    repoFullName: string | undefined,
    processed: Record<string, unknown>,
) {
    try {
        // Find workspace(s) that have this repo's owner as a connected GitHub account
        // This is a best-effort link — webhook events are stored even if no workspace matches
        await prisma.toolExecution.create({
            data: {
                toolName: `webhook:github:${event}`,
                input: {
                    event,
                    action: action ?? null,
                    repository: repoFullName ?? null,
                },
                output: processed as any,
                status: 'success',
            },
        });
    } catch (error) {
        console.error('[Webhook] Failed to persist event:', error);
    }
}

// ─── Main webhook controller ────────────────────────────────────────────────

export const githubWebhookHandler: RequestHandler = async (req: Request, res: Response) => {
    // Verify signature
    const rawBody = (req as any).rawBody as string | undefined;
    const signature = req.headers['x-hub-signature-256'] as string | undefined;

    if (rawBody && !verifyWebhookSignature(rawBody, signature)) {
        console.warn('[Webhook] Invalid signature — rejecting request');
        res.status(401).json({ success: false, message: 'Invalid signature' });
        return;
    }

    const event = req.headers['x-github-event'] as GitHubWebhookEventType | undefined;
    const deliveryId = req.headers['x-github-delivery'] as string | undefined;
    const payload = req.body as GitHubWebhookPayload;

    console.log(`[Webhook] Received event: ${event} (delivery: ${deliveryId})`);

    // Handle ping (GitHub sends this when a webhook is first configured)
    if (event === 'ping') {
        res.status(200).json({ success: true, message: 'pong' });
        return;
    }

    let processed: Record<string, unknown> = {};

    try {
        switch (event) {
            case 'push':
                processed = await handlePushEvent(payload);
                break;
            case 'pull_request':
                processed = await handlePullRequestEvent(payload);
                break;
            case 'issues':
                processed = await handleIssuesEvent(payload);
                break;
            default:
                console.log(`[Webhook] Unhandled event type: ${event}`);
                processed = { event, action: payload.action, unhandled: true };
                break;
        }

        // Persist to DB for audit trail
        await persistWebhookEvent(
            event ?? 'unknown',
            payload.action,
            payload.repository?.full_name,
            processed,
        );

        res.status(200).json({ success: true, event, processed });
    } catch (error) {
        console.error('[Webhook] Error processing event:', error);
        res.status(500).json({
            success: false,
            message: 'Webhook processing failed',
        });
    }
};
