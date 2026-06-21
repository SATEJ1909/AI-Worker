import express, { Router } from 'express'
import { isAuthenticated } from '../../shared/middleware.js'
import {
    getWorkspaceIntegrationsHandler,
    deleteWorkspaceIntegrationHandler,
} from './integrations.controller.js'

const IntegrationsRouter: express.Router = Router({ mergeParams: true });

IntegrationsRouter.get('/', isAuthenticated, getWorkspaceIntegrationsHandler);
IntegrationsRouter.delete('/:integrationId', isAuthenticated, deleteWorkspaceIntegrationHandler);

export default IntegrationsRouter;
