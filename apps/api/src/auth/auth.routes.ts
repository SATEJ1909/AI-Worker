import { Router } from "express";
import { signupHandler , loginHandler } from "./auth.controller.js";

const userRouter: Router = Router();

userRouter.post('/signup' , signupHandler);
userRouter.post('/login' , loginHandler);

export default userRouter