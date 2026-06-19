export const GITHUB_PROVIDER = 'github';

export type GitHubOAuthState = {
    userId: string;
    workspaceId: string;
    provider: typeof GITHUB_PROVIDER;
    nonce: string;
}

export type GitHubProfile = {
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    htmlUrl: string;
}

export type GitHubRepo = {
    id: number;
    name: string;
    fullName: string;
    private: boolean;
    htmlUrl: string;
    description: string | null;
    defaultBranch: string | null;
    updatedAt: string | null;
}

export type GitHubConnectionStatus = {
    connected: boolean;
    provider: typeof GITHUB_PROVIDER;
    accountEmail?: string | null;
    accountLogin?: string | null;
    accountName?: string | null;
    avatarUrl?: string | null;
    connectedAt?: Date;
}

export class GitHubIntegrationError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 500) {
        super(message);
        this.name = 'GitHubIntegrationError';
        this.statusCode = statusCode;
    }
}
