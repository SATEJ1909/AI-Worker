
import 'dotenv/config';

if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start without it.');
}

const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';

export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
export const GITHUB_OAUTH_CALLBACK_URL = process.env.GITHUB_OAUTH_CALLBACK_URL || process.env.GITHUB_CALLBACK_URL || '';
export const GITHUB_OAUTH_SUCCESS_REDIRECT_URL = process.env.GITHUB_OAUTH_SUCCESS_REDIRECT_URL || '';
export const GITHUB_OAUTH_ERROR_REDIRECT_URL = process.env.GITHUB_OAUTH_ERROR_REDIRECT_URL || '';
export const GITHUB_OAUTH_STATE_SECRET = process.env.GITHUB_OAUTH_STATE_SECRET || JWT_SECRET;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

export default JWT_SECRET;
