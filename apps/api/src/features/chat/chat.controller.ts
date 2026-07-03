import type { Request, RequestHandler } from 'express';
import { prisma } from '../../config/prisma.js';
import {
    createConversation,
    getConversations,
    getConversationById,
    deleteConversation,
    addMessage,
    autoTitleConversation,
} from './chat.service.js';
import { runAgentLoop } from '../agent/agent.orchestrator.js';

const getAuthenticatedUserId = (req: Request) => {
    return req.user?.id;
};

const getWorkspaceId = (req: Request) => {
    const { id } = req.params;
    return typeof id === 'string' ? id : undefined;
};

const getConversationId = (req: Request) => {
    const { conversationId } = req.params;
    return typeof conversationId === 'string' ? conversationId : undefined;
};

async function verifyWorkspaceAccess(userId: string, workspaceId: string) {
    const workspace = await prisma.workspace.findFirst({
        where: { id: workspaceId, ownerId: userId },
        select: { id: true },
    });
    return !!workspace;
}

// POST /api/v1/workspaces/:id/chat
export const createConversationHandler: RequestHandler = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const workspaceId = getWorkspaceId(req);

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        if (!workspaceId) {
            res.status(400).json({ success: false, message: 'Workspace ID is required' });
            return;
        }

        const hasAccess = await verifyWorkspaceAccess(userId, workspaceId);
        if (!hasAccess) {
            res.status(404).json({ success: false, message: 'Workspace not found' });
            return;
        }

        const { title } = req.body || {};
        const conversation = await createConversation(workspaceId, typeof title === 'string' ? title : undefined);

        res.status(201).json({
            success: true,
            message: 'Conversation created successfully',
            conversation,
        });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

// GET /api/v1/workspaces/:id/chat
export const getConversationsHandler: RequestHandler = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const workspaceId = getWorkspaceId(req);

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        if (!workspaceId) {
            res.status(400).json({ success: false, message: 'Workspace ID is required' });
            return;
        }

        const hasAccess = await verifyWorkspaceAccess(userId, workspaceId);
        if (!hasAccess) {
            res.status(404).json({ success: false, message: 'Workspace not found' });
            return;
        }

        const conversations = await getConversations(workspaceId);

        res.status(200).json({
            success: true,
            message: 'Conversations fetched successfully',
            conversations,
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

// GET /api/v1/workspaces/:id/chat/:conversationId
export const getConversationHandler: RequestHandler = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const workspaceId = getWorkspaceId(req);
        const conversationId = getConversationId(req);

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        if (!workspaceId || !conversationId) {
            res.status(400).json({ success: false, message: 'Workspace ID and Conversation ID are required' });
            return;
        }

        const hasAccess = await verifyWorkspaceAccess(userId, workspaceId);
        if (!hasAccess) {
            res.status(404).json({ success: false, message: 'Workspace not found' });
            return;
        }

        const conversation = await getConversationById(workspaceId, conversationId);
        if (!conversation) {
            res.status(404).json({ success: false, message: 'Conversation not found' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Conversation fetched successfully',
            conversation,
        });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

// DELETE /api/v1/workspaces/:id/chat/:conversationId
export const deleteConversationHandler: RequestHandler = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const workspaceId = getWorkspaceId(req);
        const conversationId = getConversationId(req);

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        if (!workspaceId || !conversationId) {
            res.status(400).json({ success: false, message: 'Workspace ID and Conversation ID are required' });
            return;
        }

        const hasAccess = await verifyWorkspaceAccess(userId, workspaceId);
        if (!hasAccess) {
            res.status(404).json({ success: false, message: 'Workspace not found' });
            return;
        }

        await deleteConversation(workspaceId, conversationId);

        res.status(200).json({
            success: true,
            message: 'Conversation deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

// POST /api/v1/workspaces/:id/chat/:conversationId/messages
export const sendMessageHandler: RequestHandler = async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    const workspaceId = getWorkspaceId(req);
    const conversationId = getConversationId(req);

    if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    if (!workspaceId || !conversationId) {
        res.status(400).json({ success: false, message: 'Workspace ID and Conversation ID are required' });
        return;
    }

    try {
        const conversation = await getConversationById(workspaceId, conversationId);
        if (!conversation) {
            res.status(404).json({ success: false, message: 'Conversation not found' });
            return;
        }

        const { content } = req.body || {};
        if (typeof content !== 'string' || !content.trim()) {
            res.status(400).json({ success: false, message: 'Message content is required' });
            return;
        }

        const trimmedContent = content.trim();

        // Save user message
        await addMessage(conversationId, 'user', trimmedContent);

        // Auto title if this is the first message (or no title)
        if (!conversation.title && conversation.messages.length === 0) {
            await autoTitleConversation(conversationId, trimmedContent);
        }

        // Set SSE Headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        let isClosed = false;
        req.on('close', () => {
            isClosed = true;
        });

        // Run agent loop
        const agentStream = runAgentLoop({
            workspaceId,
            userId,
            conversationId,
            userMessage: trimmedContent,
        });

        for await (const event of agentStream) {
            if (isClosed) break;
            res.write(`data: ${JSON.stringify(event)}\n\n`);
        }

        if (!isClosed) {
            res.write('data: [DONE]\n\n');
            res.end();
        }
    } catch (error) {
        console.error('Error sending message:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Something went wrong' });
        } else {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Internal server error during streaming' })}\n\n`);
            res.end();
        }
    }
};
