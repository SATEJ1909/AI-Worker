import { prisma } from "../../config/prisma.js";

const workspaceSelect = {
    id: true,
    name: true,
    ownerId: true,
    createdAt: true,
    updatedAt: true,
} as const;

const validateWorkspaceName = (name: unknown) => {
    if (typeof name !== 'string') {
        throw new Error('Workspace name is required');
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
        throw new Error('Workspace name is required');
    }

    if (trimmedName.length > 40) {
        throw new Error('Workspace name must be 100 characters or less');
    }

    return trimmedName;
}

export const createWorkspace = async (ownerId: string, name?: unknown) => {
    try {
        const data = name === undefined
            ? { ownerId }
            : { ownerId, name: validateWorkspaceName(name) };

        const workspace = await prisma.workspace.create({
            data,
            select: workspaceSelect,
        });

        return workspace;
    } catch (error) {
        console.error("Error in createWorkspace service:", error);
        throw error;
    }
}

export const getWorkspaces = async (ownerId: string) => {
    try {
        const workspaces = await prisma.workspace.findMany({
            where: { ownerId },
            orderBy: { createdAt: 'desc' },
            select: workspaceSelect,
        });

        return workspaces;
    } catch (error) {
        console.error("Error in getWorkspaces service:", error);
        throw error;
    }
}

export const getWorkspaceById = async (ownerId: string, workspaceId: string) => {
    try {
        const workspace = await prisma.workspace.findFirst({
            where: {
                id: workspaceId,
                ownerId,
            },
            select: workspaceSelect,
        });

        return workspace;
    } catch (error) {
        console.error("Error in getWorkspaceById service:", error);
        throw error;
    }
}

export const updateWorkspace = async (ownerId: string, workspaceId: string, name: unknown) => {
    try {
        const existingWorkspace = await getWorkspaceById(ownerId, workspaceId);
        if (!existingWorkspace) {
            throw new Error('Workspace not found');
        }

        const workspace = await prisma.workspace.update({
            where: { id: workspaceId },
            data: { name: validateWorkspaceName(name) },
            select: workspaceSelect,
        });

        return workspace;
    } catch (error) {
        console.error("Error in updateWorkspace service:", error);
        throw error;
    }
}
