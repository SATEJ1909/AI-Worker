import type { Request, RequestHandler } from 'express'
import {
    connectGitHubFromCallback,
    createGitHubOAuthUrl,
    disconnectGitHub,
    getGitHubRepos,
    getGitHubStatus,
    getStoredGitHubProfile,
} from './github.service.js'
import { GitHubIntegrationError } from './github.types.js'
import {
    GITHUB_OAUTH_CALLBACK_URL,
    GITHUB_OAUTH_ERROR_REDIRECT_URL,
    GITHUB_OAUTH_SUCCESS_REDIRECT_URL,
} from '../../../config/config.js'

const getAuthenticatedUserId = (req: Request) => {
    return req.user?.id;
}

const getStringQueryParam = (value: unknown) => {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

const getWorkspaceId = (req: Request) => {
    return getStringQueryParam(req.query.workspaceId);
}

const getRequestCallbackUrl = (req: Request) => {
    if (GITHUB_OAUTH_CALLBACK_URL) {
        return GITHUB_OAUTH_CALLBACK_URL;
    }

    return `${req.protocol}://${req.get('host')}/api/integrations/github/callback`;
}

const handleGithubError = (res: Parameters<RequestHandler>[1], error: unknown) => {
    console.log(error);

    if (error instanceof GitHubIntegrationError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }

    res.status(500).json({
        success: false,
        message: 'Something went wrong',
    });
}

export const connectGitHubHandler: RequestHandler = async (req, res) => {
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

        const authorizationUrl = await createGitHubOAuthUrl(userId, workspaceId, getRequestCallbackUrl(req));
        res.status(200).json({ success: true, url: authorizationUrl });
    } catch (error) {
        handleGithubError(res, error);
    }
}

export const githubCallbackHandler: RequestHandler = async (req, res) => {
    try {
        const code = getStringQueryParam(req.query.code);
        const state = getStringQueryParam(req.query.state);

        if (!code || !state) {
            res.status(400).json({ success: false, message: 'GitHub code and state are required' });
            return;
        }

        const result = await connectGitHubFromCallback(code, state, getRequestCallbackUrl(req));

        if (GITHUB_OAUTH_SUCCESS_REDIRECT_URL) {
            const redirectUrl = new URL(GITHUB_OAUTH_SUCCESS_REDIRECT_URL);
            redirectUrl.searchParams.set('provider', 'github');
            redirectUrl.searchParams.set('workspaceId', result.workspaceId);
            res.redirect(redirectUrl.toString());
            return;
        }

        res.status(200).json({
            success: true,
            message: 'GitHub connected successfully',
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
        if (GITHUB_OAUTH_ERROR_REDIRECT_URL) {
            const redirectUrl = new URL(GITHUB_OAUTH_ERROR_REDIRECT_URL);
            redirectUrl.searchParams.set(
                'message',
                error instanceof Error ? error.message : 'GitHub connection failed',
            );
            res.redirect(redirectUrl.toString());
            return;
        }

        handleGithubError(res, error);
    }
}

export const getGitHubStatusHandler: RequestHandler = async (req, res) => {
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

        const status = await getGitHubStatus(userId, workspaceId);
        res.status(200).json({
            success: true,
            message: 'GitHub status fetched successfully',
            status,
        });
    } catch (error) {
        handleGithubError(res, error);
    }
}

export const getGitHubProfileHandler: RequestHandler = async (req, res) => {
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

        const profile = await getStoredGitHubProfile(userId, workspaceId);
        res.status(200).json({
            success: true,
            message: 'GitHub profile fetched successfully',
            profile,
        });
    } catch (error) {
        handleGithubError(res, error);
    }
}

export const getGitHubReposHandler: RequestHandler = async (req, res) => {
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

        const repos = await getGitHubRepos(userId, workspaceId);
        res.status(200).json({
            success: true,
            message: 'GitHub repositories fetched successfully',
            repos,
        });
    } catch (error) {
        handleGithubError(res, error);
    }
}

export const disconnectGitHubHandler: RequestHandler = async (req, res) => {
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

        const disconnected = await disconnectGitHub(userId, workspaceId);
        res.status(200).json({
            success: true,
            message: disconnected ? 'GitHub disconnected successfully' : 'GitHub was not connected',
            disconnected,
        });
    } catch (error) {
        handleGithubError(res, error);
    }
}
