// ─── Google Integration Controller ──────────────────────────────────────────

import type { Request, RequestHandler } from 'express';
import {
    connectGoogleFromCallback,
    createGoogleOAuthUrl,
    disconnectGoogle,
    getGoogleStatus,
} from './google.service.js';
import { GoogleIntegrationError } from './google.types.js';
import {
    GOOGLE_OAUTH_CALLBACK_URL,
    GOOGLE_OAUTH_SUCCESS_REDIRECT_URL,
    GOOGLE_OAUTH_ERROR_REDIRECT_URL,
} from '../../../config/config.js';

// ─── Utility helpers ─────────────────────────────────────────────────────────

const getAuthenticatedUserId = (req: Request) => req.user?.id;

const getStringQueryParam = (value: unknown) =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined;

const getWorkspaceId = (req: Request) => getStringQueryParam(req.query.workspaceId);

const getRequestCallbackUrl = (req: Request) => {
    if (GOOGLE_OAUTH_CALLBACK_URL) return GOOGLE_OAUTH_CALLBACK_URL;
    return `${req.protocol}://${req.get('host')}/api/integrations/google/callback`;
};

const handleGoogleError = (res: Parameters<RequestHandler>[1], error: unknown) => {
    console.error('[Google]', error);

    if (error instanceof GoogleIntegrationError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
    }

    res.status(500).json({ success: false, message: 'Something went wrong' });
};

// ─── Handlers ────────────────────────────────────────────────────────────────

export const connectGoogleHandler: RequestHandler = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) {
            res.status(400).json({ success: false, message: 'workspaceId is required' });
            return;
        }

        const url = await createGoogleOAuthUrl(userId, workspaceId, getRequestCallbackUrl(req));
        res.status(200).json({ success: true, url });
    } catch (error) {
        handleGoogleError(res, error);
    }
};

export const googleCallbackHandler: RequestHandler = async (req, res) => {
    try {
        const code = getStringQueryParam(req.query.code);
        const state = getStringQueryParam(req.query.state);

        if (!code || !state) {
            res.status(400).json({ success: false, message: 'Google code and state are required' });
            return;
        }

        const result = await connectGoogleFromCallback(code, state, getRequestCallbackUrl(req));

        if (GOOGLE_OAUTH_SUCCESS_REDIRECT_URL) {
            const redirectUrl = new URL(GOOGLE_OAUTH_SUCCESS_REDIRECT_URL);
            redirectUrl.searchParams.set('provider', 'google');
            redirectUrl.searchParams.set('workspaceId', result.workspaceId);
            res.redirect(redirectUrl.toString());
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Google connected successfully',
            integration: {
                id: result.integration.id,
                provider: result.integration.provider,
                workspaceId: result.integration.workspaceId,
                accountEmail: result.integration.accountEmail,
                metadata: result.integration.metadata,
                createdAt: result.integration.createdAt,
            },
            profile: result.profile,
        });
    } catch (error) {
        if (GOOGLE_OAUTH_ERROR_REDIRECT_URL) {
            const redirectUrl = new URL(GOOGLE_OAUTH_ERROR_REDIRECT_URL);
            redirectUrl.searchParams.set(
                'message',
                error instanceof Error ? error.message : 'Google connection failed',
            );
            res.redirect(redirectUrl.toString());
            return;
        }
        handleGoogleError(res, error);
    }
};

export const getGoogleStatusHandler: RequestHandler = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const workspaceId = getWorkspaceId(req);

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        if (!workspaceId) {
            res.status(400).json({ success: false, message: 'workspaceId is required' });
            return;
        }

        const status = await getGoogleStatus(userId, workspaceId);
        res.status(200).json({ success: true, status });
    } catch (error) {
        handleGoogleError(res, error);
    }
};

export const disconnectGoogleHandler: RequestHandler = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const workspaceId = getWorkspaceId(req);

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        if (!workspaceId) {
            res.status(400).json({ success: false, message: 'workspaceId is required' });
            return;
        }

        const disconnected = await disconnectGoogle(userId, workspaceId);
        res.status(200).json({
            success: true,
            message: disconnected ? 'Google disconnected successfully' : 'Google was not connected',
            disconnected,
        });
    } catch (error) {
        handleGoogleError(res, error);
    }
};
