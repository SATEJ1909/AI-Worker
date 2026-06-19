import { randomBytes } from 'node:crypto'
import { Octokit } from '@octokit/rest'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { prisma } from '../../../config/prisma.js'
import {
    GITHUB_PROVIDER,
    GitHubIntegrationError,
    type GitHubConnectionStatus,
    type GitHubOAuthState,
    type GitHubProfile,
    type GitHubRepo,
} from './github.types.js'
import {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_OAUTH_STATE_SECRET,
} from '../../../config/config.js'

const githubAuthorizeUrl = 'https://github.com/login/oauth/authorize';
const githubTokenUrl = 'https://github.com/login/oauth/access_token';
const githubScopes = ['read:user', 'repo'];

const integrationSelect = {
    id: true,
    workspaceId: true,
    provider: true,
    accountEmail: true,
    accessToken: true,
    metadata: true,
    createdAt: true,
} as const;

const ensureGithubOAuthConfig = () => {
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        throw new GitHubIntegrationError('GitHub OAuth is not configured', 500);
    }
}

const ensureWorkspaceAccess = async (userId: string, workspaceId: string) => {
    const workspace = await prisma.workspace.findFirst({
        where: {
            id: workspaceId,
            ownerId: userId,
        },
        select: { id: true },
    });

    if (!workspace) {
        throw new GitHubIntegrationError('Workspace not found', 404);
    }
}

const getGitHubIntegration = async (userId: string, workspaceId: string) => {
    await ensureWorkspaceAccess(userId, workspaceId);

    return prisma.integration.findFirst({
        where: {
            workspaceId,
            provider: GITHUB_PROVIDER,
        },
        orderBy: { createdAt: 'desc' },
        select: integrationSelect,
    });
}

const parseMetadata = (metadata: unknown) => {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        return {};
    }

    return metadata as Record<string, unknown>;
}

const mapGitHubProfile = (profile: Awaited<ReturnType<Octokit['users']['getAuthenticated']>>['data']): GitHubProfile => ({
    id: profile.id,
    login: profile.login,
    name: profile.name,
    email: profile.email,
    avatarUrl: profile.avatar_url,
    htmlUrl: profile.html_url,
});

const mapGitHubRepo = (repo: Awaited<ReturnType<Octokit['repos']['listForAuthenticatedUser']>>['data'][number]): GitHubRepo => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    htmlUrl: repo.html_url,
    description: repo.description,
    defaultBranch: repo.default_branch,
    updatedAt: repo.updated_at,
});

const createGitHubClient = (accessToken: string) => {
    return new Octokit({ auth: accessToken });
}

const handleGitHubApiError = (error: unknown): never => {
    if (typeof error === 'object' && error && 'status' in error) {
        const status = Number((error as { status?: unknown }).status);
        if (status === 401 || status === 403) {
            throw new GitHubIntegrationError('GitHub token is invalid or expired. Reconnect GitHub.', 401);
        }
    }

    throw error;
}

const requireGitHubIntegration = async (userId: string, workspaceId: string) => {
    const integration = await getGitHubIntegration(userId, workspaceId);
    if (!integration) {
        throw new GitHubIntegrationError('GitHub is not connected', 404);
    }

    return integration;
}

export const createGitHubOAuthUrl = async (
    userId: string,
    workspaceId: string,
    redirectUri: string,
) => {
    ensureGithubOAuthConfig();
    await ensureWorkspaceAccess(userId, workspaceId);

    const statePayload: GitHubOAuthState = {
        userId,
        workspaceId,
        provider: GITHUB_PROVIDER,
        nonce: randomBytes(16).toString('hex'),
    };

    const state = jwt.sign(statePayload, GITHUB_OAUTH_STATE_SECRET, { expiresIn: '10m' });
    const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: githubScopes.join(' '),
        state,
        allow_signup: 'true',
    });

    return `${githubAuthorizeUrl}?${params.toString()}`;
}

export const verifyGitHubOAuthState = (state: string) => {
    try {
        const decoded = jwt.verify(state, GITHUB_OAUTH_STATE_SECRET) as JwtPayload;
        if (
            typeof decoded.userId !== 'string'
            || typeof decoded.workspaceId !== 'string'
            || decoded.provider !== GITHUB_PROVIDER
            || typeof decoded.nonce !== 'string'
        ) {
            throw new GitHubIntegrationError('Invalid OAuth state', 400);
        }

        return {
            userId: decoded.userId,
            workspaceId: decoded.workspaceId,
            provider: GITHUB_PROVIDER,
            nonce: decoded.nonce,
        } satisfies GitHubOAuthState;
    } catch (error) {
        if (error instanceof GitHubIntegrationError) {
            throw error;
        }

        throw new GitHubIntegrationError('Invalid or expired OAuth state', 400);
    }
}

export const exchangeCodeForAccessToken = async (code: string, redirectUri: string) => {
    ensureGithubOAuthConfig();

    const response = await fetch(githubTokenUrl, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: redirectUri,
        }),
    });

    if (!response.ok) {
        throw new GitHubIntegrationError('Failed to exchange GitHub authorization code', 502);
    }

    const payload = await response.json() as {
        access_token?: string;
        scope?: string;
        token_type?: string;
        error?: string;
        error_description?: string;
    };

    if (!payload.access_token) {
        throw new GitHubIntegrationError(
            payload.error_description || payload.error || 'GitHub did not return an access token',
            400,
        );
    }

    return {
        accessToken: payload.access_token,
        scope: payload.scope,
        tokenType: payload.token_type,
    };
}

export const fetchGitHubProfileWithToken = async (accessToken: string) => {
    try {
        const octokit = createGitHubClient(accessToken);
        const { data } = await octokit.users.getAuthenticated();
        return mapGitHubProfile(data);
    } catch (error) {
        return handleGitHubApiError(error);
    }
}

export const saveGitHubConnection = async (
    userId: string,
    workspaceId: string,
    accessToken: string,
    profile: GitHubProfile,
    scope?: string,
    tokenType?: string,
) => {
    await ensureWorkspaceAccess(userId, workspaceId);

    const existingIntegration = await prisma.integration.findFirst({
        where: {
            workspaceId,
            provider: GITHUB_PROVIDER,
        },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
    });

    const metadata = {
        githubUserId: profile.id,
        login: profile.login,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        htmlUrl: profile.htmlUrl,
        scope: scope ?? null,
        tokenType: tokenType ?? null,
        connectedAt: new Date().toISOString(),
    };

    if (existingIntegration) {
        return prisma.integration.update({
            where: { id: existingIntegration.id },
            data: {
                accountEmail: profile.email,
                accessToken,
                metadata,
            },
            select: integrationSelect,
        });
    }

    return prisma.integration.create({
        data: {
            workspaceId,
            provider: GITHUB_PROVIDER,
            accountEmail: profile.email,
            accessToken,
            metadata,
        },
        select: integrationSelect,
    });
}

export const connectGitHubFromCallback = async (code: string, state: string, redirectUri: string) => {
    const oauthState = verifyGitHubOAuthState(state);
    const token = await exchangeCodeForAccessToken(code, redirectUri);
    const profile = await fetchGitHubProfileWithToken(token.accessToken);
    const integration = await saveGitHubConnection(
        oauthState.userId,
        oauthState.workspaceId,
        token.accessToken,
        profile,
        token.scope,
        token.tokenType,
    );

    return {
        integration,
        profile,
        workspaceId: oauthState.workspaceId,
    };
}

export const getGitHubStatus = async (
    userId: string,
    workspaceId: string,
): Promise<GitHubConnectionStatus> => {
    const integration = await getGitHubIntegration(userId, workspaceId);
    if (!integration) {
        return {
            connected: false,
            provider: GITHUB_PROVIDER,
        };
    }

    const metadata = parseMetadata(integration.metadata);

    return {
        connected: true,
        provider: GITHUB_PROVIDER,
        accountEmail: integration.accountEmail,
        accountLogin: typeof metadata.login === 'string' ? metadata.login : null,
        accountName: typeof metadata.name === 'string' ? metadata.name : null,
        avatarUrl: typeof metadata.avatarUrl === 'string' ? metadata.avatarUrl : null,
        connectedAt: integration.createdAt,
    };
}

export const getStoredGitHubProfile = async (userId: string, workspaceId: string) => {
    const integration = await requireGitHubIntegration(userId, workspaceId);
    const profile = await fetchGitHubProfileWithToken(integration.accessToken);

    await saveGitHubConnection(userId, workspaceId, integration.accessToken, profile);

    return profile;
}

export const getGitHubRepos = async (userId: string, workspaceId: string) => {
    const integration = await requireGitHubIntegration(userId, workspaceId);

    try {
        const octokit = createGitHubClient(integration.accessToken);
        const repos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
            per_page: 100,
            sort: 'updated',
            affiliation: 'owner,collaborator,organization_member',
        });

        return repos.map(mapGitHubRepo);
    } catch (error) {
        return handleGitHubApiError(error);
    }
}

export const disconnectGitHub = async (userId: string, workspaceId: string) => {
    await ensureWorkspaceAccess(userId, workspaceId);

    const deleted = await prisma.integration.deleteMany({
        where: {
            workspaceId,
            provider: GITHUB_PROVIDER,
        },
    });

    return deleted.count > 0;
}
