import express, { Router } from 'express';
import { isAuthenticated } from '../../../shared/middleware.js';
import {
    connectGoogleHandler,
    disconnectGoogleHandler,
    getGoogleStatusHandler,
    googleCallbackHandler,
} from './google.controller.js';

const GoogleRouter: express.Router = Router();

GoogleRouter.get('/connect', isAuthenticated, connectGoogleHandler);
GoogleRouter.get('/callback', googleCallbackHandler);
GoogleRouter.get('/status', isAuthenticated, getGoogleStatusHandler);
GoogleRouter.delete('/disconnect', isAuthenticated, disconnectGoogleHandler);

export default GoogleRouter;
