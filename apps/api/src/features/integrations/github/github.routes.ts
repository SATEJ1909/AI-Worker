import express, { Router } from 'express'
import { isAuthenticated } from '../../../shared/middleware.js'
import {
    connectGitHubHandler,
    disconnectGitHubHandler,
    getGitHubProfileHandler,
    getGitHubReposHandler,
    getGitHubStatusHandler,
    githubCallbackHandler,
} from './github.controller.js'

const GitHubRouter: express.Router = Router();

GitHubRouter.get('/connect', isAuthenticated, connectGitHubHandler);
GitHubRouter.get('/callback', githubCallbackHandler);
GitHubRouter.get('/status', isAuthenticated, getGitHubStatusHandler);
GitHubRouter.get('/profile', isAuthenticated, getGitHubProfileHandler);
GitHubRouter.get('/repos', isAuthenticated, getGitHubReposHandler);
GitHubRouter.delete('/disconnect', isAuthenticated, disconnectGitHubHandler);

export default GitHubRouter;
