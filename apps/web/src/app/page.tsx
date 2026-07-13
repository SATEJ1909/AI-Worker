'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/api-client';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = getAccessToken();
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/sign-in');
    }
  }, [router]);

  // Prevent hydration mismatch by returning null or a loader on first render
  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-foreground border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-4 border-foreground border-t-transparent animate-spin"></div>
    </div>
  );
}
