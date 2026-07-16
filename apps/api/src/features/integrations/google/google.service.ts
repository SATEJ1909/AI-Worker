// ─── Google Integration Service ──────────────────────────────────────────────
//
// Handles OAuth 2.0 flow, token storage/refresh, and provides an authenticated
// googleapis OAuth2Client for use by the AI tool layer.

import { randomBytes } from 'node:crypto';
import { google } from 'googleapis';
import type { Credentials } from 'google-auth-library';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { prisma } from '../../../config/prisma.js';
import { encryptToken, decryptToken, isEncryptedToken } from '../../../shared/crypto.js';
import {
    GOOGLE_PROVIDER,
    GoogleIntegrationError,
    type GoogleOAuthState,
    type GoogleProfile,
    type GoogleConnectionStatus,
} from './google.types.js';
import {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_OAUTH_STATE_SECRET,
} from '../../../config/config.js';

// ─── Scopes ─────────────────────────────────────────────────────────────────

const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveToken(stored: string): string {
    return isEncryptedToken(stored) ? decryptToken(stored) : stored;
}

function ensureGoogleConfig() {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        throw new GoogleIntegrationError('Google OAuth is not configured', 500);
    }
}

function createOAuth2Client(redirectUri?: string) {
    return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
}

const integrationSelect = {
    id: true,
    workspaceId: true,
    provider: true,
    accountEmail: true,
    accessToken: true,
    refreshToken: true,
    metadata: true,
    createdAt: true,
} as const;

async function ensureWorkspaceAccess(userId: string, workspaceId: string) {
    const ws = await prisma.workspace.findFirst({
        where: { id: workspaceId, ownerId: userId },
        select: { id: true },
    });
    if (!ws) throw new GoogleIntegrationError('Workspace not found', 404);
}

async function getGoogleIntegration(userId: string, workspaceId: string) {
    await ensureWorkspaceAccess(userId, workspaceId);
    return prisma.integration.findFirst({
        where: { workspaceId, provider: GOOGLE_PROVIDER },
        orderBy: { createdAt: 'desc' },
        select: integrationSelect,
    });
}

async function requireGoogleIntegration(userId: string, workspaceId: string) {
    const integration = await getGoogleIntegration(userId, workspaceId);
    if (!integration) throw new GoogleIntegrationError('Google is not connected', 404);
    return integration;
}

function parseMetadata(metadata: unknown): Record<string, unknown> {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {};
    return metadata as Record<string, unknown>;
}

// ─── OAuth Flow ──────────────────────────────────────────────────────────────

export async function createGoogleOAuthUrl(
    userId: string,
    workspaceId: string,
    redirectUri: string,
): Promise<string> {
    ensureGoogleConfig();
    await ensureWorkspaceAccess(userId, workspaceId);

    const statePayload: GoogleOAuthState = {
        userId,
        workspaceId,
        provider: GOOGLE_PROVIDER,
        nonce: randomBytes(16).toString('hex'),
    };

    const state = jwt.sign(statePayload, GOOGLE_OAUTH_STATE_SECRET, { expiresIn: '10m' });
    const oauth2Client = createOAuth2Client(redirectUri);

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: GOOGLE_SCOPES,
        state,
        prompt: 'consent', // force refresh_token on every connect
    });
}

export function verifyGoogleOAuthState(state: string): GoogleOAuthState {
    try {
        const decoded = jwt.verify(state, GOOGLE_OAUTH_STATE_SECRET) as JwtPayload;
        if (
            typeof decoded.userId !== 'string'
            || typeof decoded.workspaceId !== 'string'
            || decoded.provider !== GOOGLE_PROVIDER
            || typeof decoded.nonce !== 'string'
        ) {
            throw new GoogleIntegrationError('Invalid OAuth state', 400);
        }
        return {
            userId: decoded.userId,
            workspaceId: decoded.workspaceId,
            provider: GOOGLE_PROVIDER,
            nonce: decoded.nonce,
        };
    } catch (err) {
        if (err instanceof GoogleIntegrationError) throw err;
        throw new GoogleIntegrationError('Invalid or expired OAuth state', 400);
    }
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<Credentials> {
    ensureGoogleConfig();
    const oauth2Client = createOAuth2Client(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
        throw new GoogleIntegrationError('Google did not return an access token', 400);
    }

    return tokens;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleProfile> {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    return {
        id: data.id ?? '',
        email: data.email ?? '',
        name: data.name ?? null,
        picture: data.picture ?? null,
    };
}

export async function saveGoogleConnection(
    userId: string,
    workspaceId: string,
    accessToken: string,
    refreshToken: string | null | undefined,
    profile: GoogleProfile,
) {
    await ensureWorkspaceAccess(userId, workspaceId);

    const existing = await prisma.integration.findFirst({
        where: { workspaceId, provider: GOOGLE_PROVIDER },
        select: { id: true, refreshToken: true },
        orderBy: { createdAt: 'desc' },
    });

    const encryptedAccess = encryptToken(accessToken);
    // Keep old refresh token if Google didn't return a new one (it only sends it on first connect)
    const resolvedRefreshToken = refreshToken
        ? encryptToken(refreshToken)
        : (existing?.refreshToken ?? null);

    const metadata = {
        googleUserId: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        connectedAt: new Date().toISOString(),
    };

    if (existing) {
        return prisma.integration.update({
            where: { id: existing.id },
            data: {
                accountEmail: profile.email,
                accessToken: encryptedAccess,
                refreshToken: resolvedRefreshToken,
                metadata,
            },
            select: integrationSelect,
        });
    }

    return prisma.integration.create({
        data: {
            workspaceId,
            provider: GOOGLE_PROVIDER,
            accountEmail: profile.email,
            accessToken: encryptedAccess,
            refreshToken: resolvedRefreshToken,
            metadata,
        },
        select: integrationSelect,
    });
}

export async function connectGoogleFromCallback(code: string, state: string, redirectUri: string) {
    const oauthState = verifyGoogleOAuthState(state);
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const profile = await fetchGoogleUserInfo(tokens.access_token!);
    const integration = await saveGoogleConnection(
        oauthState.userId,
        oauthState.workspaceId,
        tokens.access_token!,
        tokens.refresh_token,
        profile,
    );

    return { integration, profile, workspaceId: oauthState.workspaceId };
}

// ─── Status / Disconnect ─────────────────────────────────────────────────────

export async function getGoogleStatus(
    userId: string,
    workspaceId: string,
): Promise<GoogleConnectionStatus> {
    const integration = await getGoogleIntegration(userId, workspaceId);
    if (!integration) return { connected: false, provider: GOOGLE_PROVIDER };

    const meta = parseMetadata(integration.metadata);

    return {
        connected: true,
        provider: GOOGLE_PROVIDER,
        accountEmail: integration.accountEmail,
        accountName: typeof meta.name === 'string' ? meta.name : null,
        avatarUrl: typeof meta.picture === 'string' ? meta.picture : null,
        connectedAt: integration.createdAt,
    };
}

export async function disconnectGoogle(userId: string, workspaceId: string): Promise<boolean> {
    await ensureWorkspaceAccess(userId, workspaceId);

    const integration = await prisma.integration.findFirst({
        where: { workspaceId, provider: GOOGLE_PROVIDER },
        select: { id: true, accessToken: true },
        orderBy: { createdAt: 'desc' },
    });

    if (!integration) return false;

    // Best-effort token revocation
    try {
        const plainToken = resolveToken(integration.accessToken);
        const oauth2Client = createOAuth2Client();
        oauth2Client.setCredentials({ access_token: plainToken });
        await oauth2Client.revokeToken(plainToken);
    } catch (err) {
        console.warn('[Google] Token revocation failed (non-fatal):', err);
    }

    const deleted = await prisma.integration.deleteMany({
        where: { workspaceId, provider: GOOGLE_PROVIDER },
    });

    return deleted.count > 0;
}

// ─── Authenticated Client (for AI Tools) ─────────────────────────────────────

/**
 * Returns a googleapis OAuth2Client ready to use, with auto-refresh.
 * If the stored access token is expired the refresh token is used automatically,
 * and the new access token is persisted back to the DB.
 */
export async function getGoogleOAuth2Client(workspaceId: string) {
    const integration = await prisma.integration.findFirst({
        where: { workspaceId, provider: GOOGLE_PROVIDER },
        select: { id: true, accessToken: true, refreshToken: true },
        orderBy: { createdAt: 'desc' },
    });

    if (!integration) {
        throw new GoogleIntegrationError('Google is not connected for this workspace', 404);
    }

    const plainAccess = resolveToken(integration.accessToken);
    const plainRefresh = integration.refreshToken ? resolveToken(integration.refreshToken) : undefined;

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
        access_token: plainAccess,
        refresh_token: plainRefresh ?? null,
    });

    // Persist refreshed tokens back to DB
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            try {
                await prisma.integration.updateMany({
                    where: { id: integration.id },
                    data: { accessToken: encryptToken(tokens.access_token) },
                });
            } catch (err) {
                console.warn('[Google] Failed to persist refreshed token:', err);
            }
        }
    });

    return oauth2Client;
}
