// ─── GitHub Tools ───────────────────────────────────────────────────────────
//
// Concrete tool implementations for GitHub operations.
// Reuses the existing Octokit integration from the GitHub integration feature.

import { Octokit } from '@octokit/rest';
import { prisma } from '../../../config/prisma.js';
import type { Tool, ToolExecutionContext, ToolResult } from '../tool.types.js';

const GITHUB_PROVIDER = 'github';

// ─── Helper: Get authenticated Octokit for a workspace ──────────────────────

async function getOctokitForWorkspace(workspaceId: string): Promise<Octokit> {
    const integration = await prisma.integration.findFirst({
        where: {
            workspaceId,
            provider: GITHUB_PROVIDER,
        },
        select: { accessToken: true },
        orderBy: { createdAt: 'desc' },
    });

    if (!integration) {
        throw new Error('GitHub integration not connected for this workspace');
    }

    return new Octokit({ auth: integration.accessToken });
}

// ─── Tool: List Repos ───────────────────────────────────────────────────────

export const githubListReposTool: Tool = {
    definition: {
        name: 'github_list_repos',
        description: 'List the GitHub repositories accessible to the user. Returns repository names, descriptions, and visibility.',
        parameters: [
            {
                name: 'sort',
                type: 'string',
                description: 'Sort order for repositories',
                required: false,
                enum: ['updated', 'created', 'pushed', 'full_name'],
            },
            {
                name: 'limit',
                type: 'number',
                description: 'Maximum number of repositories to return (default 30, max 100)',
                required: false,
            },
        ],
        requiresIntegration: GITHUB_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const octokit = await getOctokitForWorkspace(context.workspaceId);
            const sort = (params.sort as string) || 'updated';
            const limit = Math.min(Number(params.limit) || 30, 100);

            const { data: repos } = await octokit.repos.listForAuthenticatedUser({
                sort: sort as 'updated' | 'created' | 'pushed' | 'full_name',
                per_page: limit,
                affiliation: 'owner,collaborator,organization_member',
            });

            const result = repos.map(repo => ({
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description,
                private: repo.private,
                language: repo.language,
                defaultBranch: repo.default_branch,
                updatedAt: repo.updated_at,
                htmlUrl: repo.html_url,
                stargazersCount: repo.stargazers_count,
            }));

            return { success: true, data: result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list repositories',
            };
        }
    },
};

// ─── Tool: Get File Content ─────────────────────────────────────────────────

export const githubGetFileContentTool: Tool = {
    definition: {
        name: 'github_get_file_content',
        description: 'Read the content of a specific file from a GitHub repository. Returns the file content as text.',
        parameters: [
            {
                name: 'owner',
                type: 'string',
                description: 'Repository owner (username or organization)',
                required: true,
            },
            {
                name: 'repo',
                type: 'string',
                description: 'Repository name',
                required: true,
            },
            {
                name: 'path',
                type: 'string',
                description: 'File path within the repository (e.g., "src/index.ts" or "README.md")',
                required: true,
            },
            {
                name: 'branch',
                type: 'string',
                description: 'Branch name (defaults to the repository default branch)',
                required: false,
            },
        ],
        requiresIntegration: GITHUB_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const octokit = await getOctokitForWorkspace(context.workspaceId);

            const requestParams: {
                owner: string;
                repo: string;
                path: string;
                ref?: string;
            } = {
                owner: params.owner as string,
                repo: params.repo as string,
                path: params.path as string,
            };

            if (params.branch) {
                requestParams.ref = params.branch as string;
            }

            const { data } = await octokit.repos.getContent(requestParams);

            if (Array.isArray(data)) {
                // It's a directory, return the listing
                const listing = data.map(item => ({
                    name: item.name,
                    type: item.type,
                    path: item.path,
                    size: item.size,
                }));
                return { success: true, data: { type: 'directory', contents: listing } };
            }

            if (data.type !== 'file' || !('content' in data)) {
                return { success: false, error: 'Path does not point to a file' };
            }

            // Decode base64 content
            const content = Buffer.from(data.content, 'base64').toString('utf-8');

            // Truncate if too large (keep under ~8K chars for context window)
            const maxChars = 8000;
            const truncated = content.length > maxChars;
            const displayContent = truncated
                ? content.slice(0, maxChars) + '\n\n... [truncated — file is ' + content.length + ' chars]'
                : content;

            return {
                success: true,
                data: {
                    path: data.path,
                    size: data.size,
                    content: displayContent,
                    truncated,
                    encoding: 'utf-8',
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get file content',
            };
        }
    },
};

// ─── Tool: Search Code ──────────────────────────────────────────────────────

export const githubSearchCodeTool: Tool = {
    definition: {
        name: 'github_search_code',
        description: 'Search for code across GitHub repositories. You can scope the search to a specific repository.',
        parameters: [
            {
                name: 'query',
                type: 'string',
                description: 'Search query (e.g., "useState" or "function handleSubmit")',
                required: true,
            },
            {
                name: 'repo',
                type: 'string',
                description: 'Scope search to a specific repo in "owner/repo" format (e.g., "octocat/hello-world")',
                required: false,
            },
        ],
        requiresIntegration: GITHUB_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const octokit = await getOctokitForWorkspace(context.workspaceId);

            let q = params.query as string;
            if (params.repo) {
                q += ` repo:${params.repo as string}`;
            }

            const { data } = await octokit.search.code({
                q,
                per_page: 10,
            });

            const results = data.items.map(item => ({
                name: item.name,
                path: item.path,
                repository: item.repository.full_name,
                htmlUrl: item.html_url,
                score: item.score,
            }));

            return {
                success: true,
                data: {
                    totalCount: data.total_count,
                    results,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to search code',
            };
        }
    },
};

// ─── Tool: Create Issue ─────────────────────────────────────────────────────

export const githubCreateIssueTool: Tool = {
    definition: {
        name: 'github_create_issue',
        description: 'Create a new issue in a GitHub repository.',
        parameters: [
            {
                name: 'owner',
                type: 'string',
                description: 'Repository owner (username or organization)',
                required: true,
            },
            {
                name: 'repo',
                type: 'string',
                description: 'Repository name',
                required: true,
            },
            {
                name: 'title',
                type: 'string',
                description: 'Issue title',
                required: true,
            },
            {
                name: 'body',
                type: 'string',
                description: 'Issue body/description (supports Markdown)',
                required: false,
            },
            {
                name: 'labels',
                type: 'array',
                description: 'Array of label names to apply (e.g., ["bug", "urgent"])',
                required: false,
            },
        ],
        requiresIntegration: GITHUB_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const octokit = await getOctokitForWorkspace(context.workspaceId);

            const { data: issue } = await octokit.issues.create({
                owner: params.owner as string,
                repo: params.repo as string,
                title: params.title as string,
                ...(params.body ? { body: params.body as string } : {}),
                ...(params.labels ? { labels: params.labels as string[] } : {}),
            });

            return {
                success: true,
                data: {
                    id: issue.id,
                    number: issue.number,
                    title: issue.title,
                    htmlUrl: issue.html_url,
                    state: issue.state,
                    createdAt: issue.created_at,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create issue',
            };
        }
    },
};

// ─── Export all GitHub tools ─────────────────────────────────────────────────

export const allGitHubTools: Tool[] = [
    githubListReposTool,
    githubGetFileContentTool,
    githubSearchCodeTool,
    githubCreateIssueTool,
];
