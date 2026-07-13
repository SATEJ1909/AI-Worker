import express, { Router } from 'express'
import { signupHandler , loginHandler , getProfileHandler , refreshTokenHandler } from './user.controller.js';
import { isAuthenticated } from '../../shared/middleware.js';

const UserRouter: express.Router = Router();

UserRouter.post('/signup' , signupHandler);
UserRouter.post('/login' , loginHandler);
UserRouter.post('/refresh' , refreshTokenHandler);
UserRouter.get('/profile' , isAuthenticated , getProfileHandler);

export default UserRouter;