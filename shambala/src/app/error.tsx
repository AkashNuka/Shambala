'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="px-4 pt-16 pb-24 max-w-lg mx-auto text-center animate-fade-in">
      <div className="text-5xl mb-4">⚠️</div>
      <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
      <p className="text-text-muted text-sm mb-6">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:brightness-110 transition-all active:scale-[0.98]"
      >
        Try Again
      </button>
    </div>
  );
}
