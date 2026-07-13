'use client';

// ─── Centralized Token Management & API Client ──────────────────────────────
//
// This module provides:
// 1. Token storage helpers (getAccessToken, getRefreshToken, setTokens, clearTokens)
// 2. An `apiFetch` wrapper that auto-attaches auth headers and silently refreshes
//    expired access tokens using the refresh token.
// 3. Queue-based concurrency control — if multiple requests hit a 401 simultaneously,
//    only one refresh is attempted and all pending requests are retried with the new token.

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1`;

// ─── Token Storage ──────────────────────────────────────────────────────────

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('activeWorkspaceId');
}

export function redirectToLogin(): void {
  clearTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/sign-in';
  }
}

// ─── Silent Refresh Logic ───────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

function processQueue(error: Error | null, token: string | null) {
  for (const { resolve, reject } of refreshQueue) {
    if (error || !token) {
      reject(error || new Error('Refresh failed'));
    } else {
      resolve(token);
    }
  }
  refreshQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const res = await fetch(`${API_BASE}/user/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Token refresh failed');
  }

  setTokens(data.token, data.refreshToken);
  return data.token;
}

// ─── apiFetch — drop-in replacement for fetch() with auth ───────────────────

export async function apiFetch(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  const token = getAccessToken();
  
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  // If not a 401, return the response as-is
  if (response.status !== 401) {
    return response;
  }

  // Check if this is a token-expired error (vs truly invalid)
  // We clone the response so we can read the body and still return it if needed
  const cloned = response.clone();
  let body: { code?: string } = {};
  try {
    body = await cloned.json();
  } catch {
    // If we can't parse the body, it's not a structured auth error
    return response;
  }

  // Only attempt refresh for expired tokens
  if (body.code !== 'TOKEN_EXPIRED') {
    redirectToLogin();
    return response;
  }

  // If a refresh is already in progress, queue this request
  if (isRefreshing) {
    return new Promise<Response>((resolve, reject) => {
      refreshQueue.push({
        resolve: async (newToken: string) => {
          try {
            const retryHeaders = new Headers(init?.headers);
            retryHeaders.set('Authorization', `Bearer ${newToken}`);
            const retryResponse = await fetch(input, { ...init, headers: retryHeaders });
            resolve(retryResponse);
          } catch (err) {
            reject(err);
          }
        },
        reject: () => {
          redirectToLogin();
          reject(new Error('Session expired'));
        },
      });
    });
  }

  // Attempt the refresh
  isRefreshing = true;

  try {
    const newToken = await refreshAccessToken();
    processQueue(null, newToken);

    // Retry the original request with the new token
    const retryHeaders = new Headers(init?.headers);
    retryHeaders.set('Authorization', `Bearer ${newToken}`);
    return await fetch(input, { ...init, headers: retryHeaders });
  } catch (err) {
    processQueue(err instanceof Error ? err : new Error('Refresh failed'), null);
    redirectToLogin();
    return response;
  } finally {
    isRefreshing = false;
  }
}

// ─── Convenience: pre-built API base URL ────────────────────────────────────

export { API_BASE };
