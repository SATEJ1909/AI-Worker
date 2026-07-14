// ─── GitHub Webhook Types ───────────────────────────────────────────────────

export type GitHubWebhookEventType =
    | 'push'
    | 'pull_request'
    | 'issues'
    | 'issue_comment'
    | 'pull_request_review'
    | 'ping';

export interface GitHubWebhookPayload {
    action?: string;
    sender?: {
        login: string;
        id: number;
    };
    repository?: {
        id: number;
        full_name: string;
        name: string;
        owner: {
            login: string;
        };
    };
    // Push-specific
    ref?: string;
    before?: string;
    after?: string;
    commits?: Array<{
        id: string;
        message: string;
        author: { name: string; email: string };
        timestamp: string;
    }>;
    // PR-specific
    pull_request?: {
        number: number;
        title: string;
        state: string;
        html_url: string;
        head: { ref: string };
        base: { ref: string };
        user: { login: string };
    };
    // Issue-specific
    issue?: {
        number: number;
        title: string;
        state: string;
        html_url: string;
        user: { login: string };
        labels: Array<{ name: string }>;
    };
}
