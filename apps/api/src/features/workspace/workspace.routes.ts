import express, { Router } from 'express'
import { isAuthenticated } from '../../shared/middleware.js';
import {
    createWorkspaceHandler,
    getWorkspaceByIdHandler,
    getWorkspacesHandler,
    updateWorkspaceHandler,
    deleteWorkspaceHandler
} from './workspace.controller.js';

import IntegrationsRouter from './integrations.routes.js';
import ChatRouter from '../chat/chat.routes.js';

const WorkspaceRouter: express.Router = Router();

WorkspaceRouter.use('/:id/integrations', IntegrationsRouter);
WorkspaceRouter.use('/:id/chat', ChatRouter);

WorkspaceRouter.post('/', isAuthenticated, createWorkspaceHandler);
WorkspaceRouter.get('/', isAuthenticated, getWorkspacesHandler);
WorkspaceRouter.get('/:id', isAuthenticated, getWorkspaceByIdHandler);
WorkspaceRouter.patch('/:id', isAuthenticated, updateWorkspaceHandler);
WorkspaceRouter.delete('/:id', isAuthenticated, deleteWorkspaceHandler);

export default WorkspaceRouter;
