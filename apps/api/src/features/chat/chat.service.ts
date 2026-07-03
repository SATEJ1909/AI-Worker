// ─── Chat Service ───────────────────────────────────────────────────────────
//
// CRUD operations for conversations and messages.

import { prisma } from '../../config/prisma.js';

// ─── Conversation Operations ────────────────────────────────────────────────

const conversationSelect = {
    id: true,
    workspaceId: true,
    title: true,
    createdAt: true,
    updatedAt: true,
} as const;

export async function createConversation(workspaceId: string, title?: string) {
    return prisma.conversation.create({
        data: {
            workspaceId,
            title: title || null,
        },
        select: conversationSelect,
    });
}

export async function getConversations(workspaceId: string) {
    return prisma.conversation.findMany({
        where: { workspaceId },
        orderBy: { updatedAt: 'desc' },
        select: {
            ...conversationSelect,
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                    content: true,
                    role: true,
                    createdAt: true,
                },
            },
        },
    });
}

export async function getConversationById(workspaceId: string, conversationId: string) {
    return prisma.conversation.findFirst({
        where: {
            id: conversationId,
            workspaceId,
        },
        select: {
            ...conversationSelect,
            messages: {
                orderBy: { createdAt: 'asc' },
                select: {
                    id: true,
                    role: true,
                    content: true,
                    toolCalls: true,
                    createdAt: true,
                },
            },
        },
    });
}

export async function deleteConversation(workspaceId: string, conversationId: string) {
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            workspaceId,
        },
        select: { id: true },
    });

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    await prisma.conversation.delete({
        where: { id: conversationId },
    });

    return true;
}

// ─── Message Operations ─────────────────────────────────────────────────────

export async function addMessage(
    conversationId: string,
    role: string,
    content: string,
    toolCalls?: unknown,
) {
    const message = await prisma.message.create({
        data: {
            conversationId,
            role,
            content,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            toolCalls: (toolCalls ?? null) as any,
        },
        select: {
            id: true,
            role: true,
            content: true,
            toolCalls: true,
            createdAt: true,
        },
    });

    // Touch the conversation's updatedAt
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
    });

    return message;
}

export async function getMessages(conversationId: string, limit = 50) {
    return prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: limit,
        select: {
            id: true,
            role: true,
            content: true,
            toolCalls: true,
            createdAt: true,
        },
    });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Auto-generate a title from the first user message.
 */
export async function autoTitleConversation(conversationId: string, firstMessage: string) {
    const title = firstMessage.length > 60
        ? firstMessage.slice(0, 57) + '...'
        : firstMessage;

    await prisma.conversation.update({
        where: { id: conversationId },
        data: { title },
    });
}
