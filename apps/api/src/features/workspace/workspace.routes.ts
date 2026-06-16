import express, { Router } from 'express'
import { isAuthenticated } from '../../shared/middleware.js';
import {
    createWorkspaceHandler,
    getWorkspaceByIdHandler,
    getWorkspacesHandler,
    updateWorkspaceHandler,
} from './workspace.controller.js';

const WorkspaceRouter: express.Router = Router();

WorkspaceRouter.post('/', isAuthenticated, createWorkspaceHandler);
WorkspaceRouter.get('/', isAuthenticated, getWorkspacesHandler);
WorkspaceRouter.get('/:id', isAuthenticated, getWorkspaceByIdHandler);
WorkspaceRouter.patch('/:id', isAuthenticated, updateWorkspaceHandler);

export default WorkspaceRouter;
