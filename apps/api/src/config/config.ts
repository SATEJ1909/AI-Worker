
const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
export const GITHUB_OAUTH_CALLBACK_URL = process.env.GITHUB_OAUTH_CALLBACK_URL || '';
export const GITHUB_OAUTH_SUCCESS_REDIRECT_URL = process.env.GITHUB_OAUTH_SUCCESS_REDIRECT_URL || '';
export const GITHUB_OAUTH_ERROR_REDIRECT_URL = process.env.GITHUB_OAUTH_ERROR_REDIRECT_URL || '';
export const GITHUB_OAUTH_STATE_SECRET = process.env.GITHUB_OAUTH_STATE_SECRET || JWT_SECRET;

export default JWT_SECRET;
