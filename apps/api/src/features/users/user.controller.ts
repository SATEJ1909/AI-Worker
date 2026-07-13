import { signUp, login, getProfile } from "./user.service.js";
import jwt, { type JwtPayload } from 'jsonwebtoken'
import pkg from 'jsonwebtoken'
const { TokenExpiredError } = pkg;
import type { RequestHandler } from 'express'
import JWT_SECRET, { JWT_REFRESH_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../../config/config.js";

const authErrorMessages = new Set([
    'Invalid email or password format',
    'User already exists',
    'User does not exist. Create one first',
    'Incorrect Password',
]);

const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : 'Something went wrong';
}

function generateTokens(userId: string) {
    const accessToken = jwt.sign({ id: userId }, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
    const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY,
    });
    return { accessToken, refreshToken };
}

export const signupHandler: RequestHandler = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "Invalid email or password"
            })
            return;
        }

        const user = await signUp(email, password, typeof name === 'string' ? name : undefined);

        const { accessToken, refreshToken } = generateTokens(user.id);

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: user,
            token: accessToken,
            refreshToken: refreshToken
        })
    } catch (error) {
        console.log(error);
        const message = getErrorMessage(error);
        res.status(authErrorMessages.has(message) ? 400 : 500).json({
            success: false,
            message: authErrorMessages.has(message) ? message : "Something went wrong"
        })
    }
}


export const loginHandler: RequestHandler = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "Invalid email or password"
            })
            return;
        }

        const user = await login(email, password);

        const { accessToken, refreshToken } = generateTokens(user.id);

        const { password: _password, ...safeUser } = user;

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user: safeUser,
            token: accessToken,
            refreshToken: refreshToken
        })
    } catch (error) {
        console.log(error);
        const message = getErrorMessage(error);
        res.status(authErrorMessages.has(message) ? 401 : 500).json({
            success: false,
            message: authErrorMessages.has(message) ? message : "Something went wrong"
        })
    }
}


export const refreshTokenHandler: RequestHandler = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken || typeof refreshToken !== 'string') {
            res.status(400).json({
                success: false,
                message: 'Refresh token is required',
                code: 'REFRESH_TOKEN_MISSING'
            });
            return;
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtPayload;

        if (!decoded || typeof decoded.id !== 'string') {
            res.status(401).json({
                success: false,
                message: 'Invalid refresh token',
                code: 'REFRESH_TOKEN_INVALID'
            });
            return;
        }

        // Issue a new token pair (token rotation)
        const tokens = generateTokens(decoded.id);

        res.status(200).json({
            success: true,
            message: 'Tokens refreshed successfully',
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Refresh token has expired. Please log in again.',
                code: 'REFRESH_TOKEN_EXPIRED'
            });
            return;
        }

        console.error('[auth] Refresh token error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid refresh token',
            code: 'REFRESH_TOKEN_INVALID'
        });
    }
}


export const getProfileHandler: RequestHandler = async (req, res) => {
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

