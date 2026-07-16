// ─── Google Integration Types ────────────────────────────────────────────────

export const GOOGLE_PROVIDER = 'google';

export interface GoogleOAuthState {
    userId: string;
    workspaceId: string;
    provider: typeof GOOGLE_PROVIDER;
    nonce: string;
}

export interface GoogleProfile {
    id: string;
    email: string;
    name: string | null;
    picture: string | null;
}

export interface GoogleConnectionStatus {
    connected: boolean;
    provider: typeof GOOGLE_PROVIDER;
    accountEmail?: string | null;
    accountName?: string | null;
    avatarUrl?: string | null;
    connectedAt?: Date;
}

export class GoogleIntegrationError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 500,
    ) {
        super(message);
        this.name = 'GoogleIntegrationError';
    }
}
