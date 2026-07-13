import type { RequestHandler } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import pkg from 'jsonwebtoken'
const { TokenExpiredError } = pkg;
import JWT_SECRET from '../config/config.js'

export const isAuthenticated: RequestHandler = (req, res, next) =>{
    try {
        const header = req.headers.authorization;
        if(!header || !header.startsWith('Bearer ')){
            res.status(401).json({
                success : false ,
                message : "No token provided",
                code : "TOKEN_MISSING"
            })
            return;
        }   
        const token = header.split(' ')[1] as string;
        const decoded = jwt.verify(token , JWT_SECRET) as JwtPayload;
        if(!decoded || typeof decoded.id !== 'string'){
            res.status(401).json({
                success : false ,
                message : "Invalid token payload",
                code : "TOKEN_INVALID"
            })
            return;
        }
        req.user = { id: decoded.id };
        next();

    } catch (error) {
        if (error instanceof TokenExpiredError) {
            res.status(401).json({
                success : false ,
                message : "Token has expired",
                code : "TOKEN_EXPIRED"
            })
            return;
        }
        console.error('[auth] Token verification failed:', error);
        res.status(401).json({
            success : false ,
            message : "Invalid token",
            code : "TOKEN_INVALID"
        })
    }
}

