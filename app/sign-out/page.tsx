"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignOutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSignOut = async () => {
      try {
        const response = await fetch('/api/auth/sign-out', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Successfully signed out, redirect to home page
          router.push('/');
        } else {
          const data = await response.json();
          setError(data.message || 'Failed to sign out');
        }
      } catch (error) {
        console.error('Error during sign out:', error);
        setError('An unexpected error occurred');
      }
    };

    performSignOut();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-4 text-center bg-card border border-border rounded-lg shadow-lg">
        {error ? (
          <>
            <h1 className="text-2xl font-bold text-red-500">Sign Out Failed</h1>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 mt-4 text-white bg-primary rounded hover:bg-primary/90"
            >
              Return to Home
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <h1 className="text-2xl font-bold text-white">Signing Out...</h1>
            <p className="text-muted-foreground">Please wait while we sign you out.</p>
          </>
        )}
      </div>
    </div>
  );
}
