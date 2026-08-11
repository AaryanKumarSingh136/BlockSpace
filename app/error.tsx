'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry if available
    try {
      Sentry.captureException(error);
    } catch (e) {
      console.error('Unhandled runtime error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900/90 border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
          Application Error
        </span>

        <h1 className="text-2xl font-extrabold text-white mt-4 mb-2 tracking-tight">
          Something went wrong
        </h1>

        <p className="text-gray-400 text-xs mb-6 line-clamp-3 bg-gray-950 p-3 rounded-lg border border-gray-800 font-mono text-left">
          {error.message || 'An unexpected runtime error occurred.'}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full bg-red-600 hover:bg-red-500 text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          <Link
            href="/dashboard"
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 border border-gray-700 transition"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
