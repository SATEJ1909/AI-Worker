import { signUp , login , getProfile } from "./user.service.js";
import jwt from 'jsonwebtoken'
import type { RequestHandler } from 'express'
import JWT_SECRET from "../../config/config.js";

const authErrorMessages = new Set([
    'Invalid email or password format',
    'User already exists',
    'User does not exist. Create one first',
    'Incorrect Password',
]);

const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : 'Something went wrong';
}

export const signupHandler: RequestHandler = async(req, res) =>{
    try {
        const {email , password , name} = req.body ;
        if(!email || !password){
            res.status(400).json({
                success : false ,
                message : "Invalid email or password"
            })
            return;
        }

        const user = await signUp(email, password, typeof name === 'string' ? name : undefined);

        const token = jwt.sign({id : user.id} , JWT_SECRET , {
            expiresIn : '1h'
        })

        res.status(201).json({
            success : true ,
            message : "User created successfully" ,
            user : user,
            token : token
        })
    } catch (error) {
        console.log(error);
        const message = getErrorMessage(error);
        res.status(authErrorMessages.has(message) ? 400 : 500).json({
            success : false ,
            message : authErrorMessages.has(message) ? message : "Something went wrong"
        })
    }
}


export const loginHandler: RequestHandler = async(req, res) =>{
    try {
        const {email , password} = req.body ;
        if(!email || !password){
            res.status(400).json({
                success : false ,
                message : "Invalid email or password"
            })
            return;
        }

        const user = await login(email , password);

         const token = jwt.sign({id : user.id} , JWT_SECRET , {
            expiresIn : '1h'
        })

        const { password: _password, ...safeUser } = user;

        res.status(200).json({
            success : true ,
            message : "User logged in successfully" ,
            user : safeUser,
            token : token
        })
    } catch (error) {
        console.log(error);
        const message = getErrorMessage(error);
        res.status(authErrorMessages.has(message) ? 401 : 500).json({
            success : false ,
            message : authErrorMessages.has(message) ? message : "Something went wrong"
        })
    }
}




export const getProfileHandler: RequestHandler = async(req, res) => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const user = await getProfile(req.user.id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'User profile fetched successfully',
            user: user,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
}
