import type { Request, RequestHandler } from 'express'
import { createWorkspace, getWorkspaceById, getWorkspaces, updateWorkspace } from "./workspace.service.js";

const workspaceErrorMessages = new Set([
    'Workspace name is required',
    'Workspace name must be 100 characters or less',
]);

const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : 'Something went wrong';
}

const getAuthenticatedUserId = (req: Request) => {
    return req.user?.id;
}

const getWorkspaceId = (req: Request) => {
    const { id } = req.params;
    return typeof id === 'string' ? id : undefined;
}

export const createWorkspaceHandler: RequestHandler = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const workspace = await createWorkspace(userId, req.body?.name);

        res.status(201).json({
            success: true,
            message: 'Workspace created successfully',
            workspace,
        });
    } catch (error) {
        console.log(error);
        const message = getErrorMessage(error);
        res.status(workspaceErrorMessages.has(message) ? 400 : 500).json({
            success: false,
            message: workspaceErrorMessages.has(message) ? message : 'Something went wrong',
        });
    }
}

export const getWorkspacesHandler: RequestHandler = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const workspaces = await getWorkspaces(userId);

        res.status(200).json({
            success: true,
            message: 'Workspaces fetched successfully',
            workspaces,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
}

export const getWorkspaceByIdHandler: RequestHandler = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) {
            res.status(400).json({ success: false, message: 'Workspace id is required' });
            return;
        }

        const workspace = await getWorkspaceById(userId, workspaceId);
        if (!workspace) {
            res.status(404).json({ success: false, message: 'Workspace not found' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Workspace fetched successfully',
            workspace,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
}

export const updateWorkspaceHandler: RequestHandler = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) {
            res.status(400).json({ success: false, message: 'Workspace id is required' });
            return;
        }

        const workspace = await updateWorkspace(userId, workspaceId, req.body?.name);

        res.status(200).json({
            success: true,
            message: 'Workspace updated successfully',
            workspace,
        });
    } catch (error) {
        console.log(error);
        const message = getErrorMessage(error);
        if (message === 'Workspace not found') {
            res.status(404).json({ success: false, message });
            return;
        }

        res.status(workspaceErrorMessages.has(message) ? 400 : 500).json({
            success: false,
            message: workspaceErrorMessages.has(message) ? message : 'Something went wrong',
        });
    }
}
