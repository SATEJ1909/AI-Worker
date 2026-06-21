import type { Request, RequestHandler } from 'express'
import { prisma } from "../../config/prisma.js";

const getAuthenticatedUserId = (req: Request) => {
    return req.user?.id;
}

const getWorkspaceId = (req: Request) => {
    const { id } = req.params;
    return typeof id === 'string' ? id : undefined;
}

const getIntegrationId = (req: Request) => {
    const { integrationId } = req.params;
    return typeof integrationId === 'string' ? integrationId : undefined;
}

// GET /api/v1/workspaces/:id/integrations
export const getWorkspaceIntegrationsHandler: RequestHandler = async (req, res) => {
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

        // Verify workspace belongs to user
        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, ownerId: userId }
        });

        if (!workspace) {
            res.status(404).json({ success: false, message: 'Workspace not found' });
            return;
        }

        const integrations = await prisma.integration.findMany({
            where: { workspaceId },
            select: {
                id: true,
                provider: true,
                accountEmail: true,
                createdAt: true,
                metadata: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({
            success: true,
            message: 'Integrations fetched successfully',
            integrations,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
}

// DELETE /api/v1/workspaces/:id/integrations/:integrationId
export const deleteWorkspaceIntegrationHandler: RequestHandler = async (req, res) => {
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

        const integrationId = getIntegrationId(req);
        if (!integrationId) {
            res.status(400).json({ success: false, message: 'Integration id is required' });
            return;
        }

        // Verify workspace belongs to user
        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, ownerId: userId }
        });

        if (!workspace) {
            res.status(404).json({ success: false, message: 'Workspace not found' });
            return;
        }

        const integration = await prisma.integration.findFirst({
            where: { id: integrationId, workspaceId }
        });

        if (!integration) {
            res.status(404).json({ success: false, message: 'Integration not found' });
            return;
        }

        await prisma.integration.delete({
            where: { id: integrationId }
        });

        res.status(200).json({
            success: true,
            message: 'Integration disconnected successfully',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
}
