'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, getRefreshToken, apiFetch, API_BASE, redirectToLogin } from '@/lib/api-client';

/**
 * AuthGuard wraps dashboard pages. It validates the token on mount and
 * redirects to /sign-in if there is no valid session.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const validate = async () => {
      const token = getAccessToken();

      // No token at all — redirect immediately
      if (!token) {
        // If there's a refresh token, try to refresh silently
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          redirectToLogin();
          return;
        }
      }

      try {
        // Validate by hitting a lightweight authenticated endpoint
        // apiFetch will auto-refresh if the access token is expired
        const res = await apiFetch(`${API_BASE}/user/profile`);
        if (res.ok) {
          setStatus('authenticated');
        } else {
          redirectToLogin();
        }
      } catch {
        redirectToLogin();
      }
    };

    validate();
  }, [router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-foreground border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}
