import express, { Router } from 'express';
import { isAuthenticated } from '../../shared/middleware.js';
import {
    createConversationHandler,
    getConversationsHandler,
    getConversationHandler,
    deleteConversationHandler,
    sendMessageHandler,
} from './chat.controller.js';

const ChatRouter: express.Router = Router({ mergeParams: true });

ChatRouter.post('/', isAuthenticated, createConversationHandler);
ChatRouter.get('/', isAuthenticated, getConversationsHandler);
ChatRouter.get('/:conversationId', isAuthenticated, getConversationHandler);
ChatRouter.delete('/:conversationId', isAuthenticated, deleteConversationHandler);
ChatRouter.post('/:conversationId/messages', isAuthenticated, sendMessageHandler);

export default ChatRouter;
