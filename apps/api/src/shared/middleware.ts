import type { RequestHandler } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import JWT_SECRET from '../config/config.js'

export const isAuthenticated: RequestHandler = (req, res, next) =>{
    try {
        const header = req.headers.authorization;
        if(!header || !header.startsWith('Bearer ')){
            res.status(401).json({
                success : false ,
                message : "No token found"
            })
            return;
        }   
        const token = header.split(' ')[1] as string;
        const decoded = jwt.verify(token , JWT_SECRET) as JwtPayload;
        if(!decoded || typeof decoded.id !== 'string'){
            res.status(401).json({
                success : false ,
                message : "Invalid token"
            })
            return;
        }
        req.user = { id: decoded.id };
        next();

    } catch (error) {
        console.log(error);
        res.status(401).json({
            success : false ,
            message : "Invalid token"
        })
    }
}
