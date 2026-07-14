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

// ─── Tool: List Branches ────────────────────────────────────────────────────

export const githubListBranchesTool: Tool = {
    definition: {
        name: 'github_list_branches',
        description: 'List branches of a GitHub repository. Returns branch names and whether they are protected.',
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
                name: 'limit',
                type: 'number',
                description: 'Maximum number of branches to return (default 30, max 100)',
                required: false,
            },
        ],
        requiresIntegration: GITHUB_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const octokit = await getOctokitForWorkspace(context.workspaceId);
            const limit = Math.min(Number(params.limit) || 30, 100);

            const { data: branches } = await octokit.repos.listBranches({
                owner: params.owner as string,
                repo: params.repo as string,
                per_page: limit,
            });

            const result = branches.map(branch => ({
                name: branch.name,
                protected: branch.protected,
                commitSha: branch.commit.sha,
            }));

            return { success: true, data: result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list branches',
            };
        }
    },
};

// ─── Tool: List Commits ─────────────────────────────────────────────────────

export const githubListCommitsTool: Tool = {
    definition: {
        name: 'github_list_commits',
        description: 'List recent commits in a GitHub repository. Can filter by branch, path, or author.',
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
                name: 'branch',
                type: 'string',
                description: 'Branch or SHA to list commits from (defaults to default branch)',
                required: false,
            },
            {
                name: 'path',
                type: 'string',
                description: 'Only commits touching this file path',
                required: false,
            },
            {
                name: 'author',
                type: 'string',
                description: 'GitHub username or email to filter commits by author',
                required: false,
            },
            {
                name: 'limit',
                type: 'number',
                description: 'Maximum number of commits to return (default 20, max 100)',
                required: false,
            },
        ],
        requiresIntegration: GITHUB_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const octokit = await getOctokitForWorkspace(context.workspaceId);
            const limit = Math.min(Number(params.limit) || 20, 100);

            const requestParams: Record<string, unknown> = {
                owner: params.owner as string,
                repo: params.repo as string,
                per_page: limit,
            };

            if (params.branch) requestParams.sha = params.branch as string;
            if (params.path) requestParams.path = params.path as string;
            if (params.author) requestParams.author = params.author as string;

            const { data: commits } = await octokit.repos.listCommits(requestParams as any);

            const result = commits.map(commit => ({
                sha: commit.sha,
                message: commit.commit.message,
                author: commit.commit.author?.name ?? null,
                authorEmail: commit.commit.author?.email ?? null,
                date: commit.commit.author?.date ?? null,
                htmlUrl: commit.html_url,
            }));

            return { success: true, data: result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list commits',
            };
        }
    },
};

// ─── Tool: List Pull Requests ───────────────────────────────────────────────

export const githubListPullRequestsTool: Tool = {
    definition: {
        name: 'github_list_pull_requests',
        description: 'List pull requests for a GitHub repository. Can filter by state (open, closed, all).',
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
                name: 'state',
                type: 'string',
                description: 'Filter by PR state',
                required: false,
                enum: ['open', 'closed', 'all'],
            },
            {
                name: 'limit',
                type: 'number',
                description: 'Maximum number of PRs to return (default 20, max 100)',
                required: false,
            },
        ],
        requiresIntegration: GITHUB_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const octokit = await getOctokitForWorkspace(context.workspaceId);
            const state = (params.state as 'open' | 'closed' | 'all') || 'open';
            const limit = Math.min(Number(params.limit) || 20, 100);

            const { data: pulls } = await octokit.pulls.list({
                owner: params.owner as string,
                repo: params.repo as string,
                state,
                per_page: limit,
                sort: 'updated',
                direction: 'desc',
            });

            const result = pulls.map(pr => ({
                number: pr.number,
                title: pr.title,
                state: pr.state,
                htmlUrl: pr.html_url,
                user: pr.user?.login ?? null,
                head: pr.head.ref,
                base: pr.base.ref,
                createdAt: pr.created_at,
                updatedAt: pr.updated_at,
                mergedAt: pr.merged_at,
                draft: pr.draft,
            }));

            return { success: true, data: result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list pull requests',
            };
        }
    },
};

// ─── Tool: List Issues ──────────────────────────────────────────────────────

export const githubListIssuesTool: Tool = {
    definition: {
        name: 'github_list_issues',
        description: 'List issues for a GitHub repository. Can filter by state and labels. Only returns actual issues, not pull requests.',
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
                name: 'state',
                type: 'string',
                description: 'Filter by issue state',
                required: false,
                enum: ['open', 'closed', 'all'],
            },
            {
                name: 'labels',
                type: 'string',
                description: 'Comma-separated list of label names to filter by (e.g., "bug,urgent")',
                required: false,
            },
            {
                name: 'limit',
                type: 'number',
                description: 'Maximum number of issues to return (default 20, max 100)',
                required: false,
            },
        ],
        requiresIntegration: GITHUB_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const octokit = await getOctokitForWorkspace(context.workspaceId);
            const state = (params.state as 'open' | 'closed' | 'all') || 'open';
            const limit = Math.min(Number(params.limit) || 20, 100);

            const requestParams: Record<string, unknown> = {
                owner: params.owner as string,
                repo: params.repo as string,
                state,
                per_page: limit,
                sort: 'updated',
                direction: 'desc',
            };

            if (params.labels) {
                requestParams.labels = params.labels as string;
            }

            const { data: issues } = await octokit.issues.listForRepo(requestParams as any);

            // Filter out pull requests (GitHub's Issues API includes PRs)
            const filtered = issues.filter(issue => !issue.pull_request);

            const result = filtered.map(issue => ({
                number: issue.number,
                title: issue.title,
                state: issue.state,
                htmlUrl: issue.html_url,
                user: issue.user?.login ?? null,
                labels: issue.labels.map(l => (typeof l === 'string' ? l : l.name ?? '')),
                createdAt: issue.created_at,
                updatedAt: issue.updated_at,
                comments: issue.comments,
            }));

            return { success: true, data: result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list issues',
            };
        }
    },
};

// ─── Tool: Create Pull Request ──────────────────────────────────────────────

export const githubCreatePrTool: Tool = {
    definition: {
        name: 'github_create_pr',
        description: 'Create a new pull request in a GitHub repository.',
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
                description: 'Pull request title',
                required: true,
            },
            {
                name: 'head',
                type: 'string',
                description: 'The branch that contains your changes (e.g., "feature-branch")',
                required: true,
            },
            {
                name: 'base',
                type: 'string',
                description: 'The branch you want to merge into (e.g., "main")',
                required: true,
            },
            {
                name: 'body',
                type: 'string',
                description: 'Pull request description (supports Markdown)',
                required: false,
            },
            {
                name: 'draft',
                type: 'boolean',
                description: 'Whether to create the PR as a draft (default false)',
                required: false,
            },
        ],
        requiresIntegration: GITHUB_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const octokit = await getOctokitForWorkspace(context.workspaceId);

            const { data: pr } = await octokit.pulls.create({
                owner: params.owner as string,
                repo: params.repo as string,
                title: params.title as string,
                head: params.head as string,
                base: params.base as string,
                ...(params.body ? { body: params.body as string } : {}),
                draft: Boolean(params.draft),
            });

            return {
                success: true,
                data: {
                    number: pr.number,
                    title: pr.title,
                    htmlUrl: pr.html_url,
                    state: pr.state,
                    head: pr.head.ref,
                    base: pr.base.ref,
                    draft: pr.draft,
                    createdAt: pr.created_at,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create pull request',
            };
        }
    },
};

// ─── Tool: Update Pull Request ──────────────────────────────────────────────

export const githubUpdatePrTool: Tool = {
    definition: {
        name: 'github_update_pr',
        description: 'Update an existing pull request — change title, body, state, or base branch.',
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
                name: 'pull_number',
                type: 'number',
                description: 'The PR number to update',
                required: true,
            },
            {
                name: 'title',
                type: 'string',
                description: 'New title for the PR',
                required: false,
            },
            {
                name: 'body',
                type: 'string',
                description: 'New body/description for the PR (supports Markdown)',
                required: false,
            },
            {
                name: 'state',
                type: 'string',
                description: 'Set PR state',
                required: false,
                enum: ['open', 'closed'],
            },
            {
                name: 'base',
                type: 'string',
                description: 'Change the base branch the PR targets',
                required: false,
            },
        ],
        requiresIntegration: GITHUB_PROVIDER,
    },

    async execute(params, context): Promise<ToolResult> {
        try {
            const octokit = await getOctokitForWorkspace(context.workspaceId);

            const updateData: Record<string, unknown> = {
                owner: params.owner as string,
                repo: params.repo as string,
                pull_number: Number(params.pull_number),
            };

            if (params.title) updateData.title = params.title as string;
            if (params.body) updateData.body = params.body as string;
            if (params.state) updateData.state = params.state as string;
            if (params.base) updateData.base = params.base as string;

            const { data: pr } = await octokit.pulls.update(updateData as any);

            return {
                success: true,
                data: {
                    number: pr.number,
                    title: pr.title,
                    htmlUrl: pr.html_url,
                    state: pr.state,
                    head: pr.head.ref,
                    base: pr.base.ref,
                    draft: pr.draft,
                    updatedAt: pr.updated_at,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update pull request',
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
    githubListBranchesTool,
    githubListCommitsTool,
    githubListPullRequestsTool,
    githubListIssuesTool,
    githubCreatePrTool,
    githubUpdatePrTool,
];
