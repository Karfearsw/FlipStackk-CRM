"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    logger.error('Next.js error boundary caught error', error, {
      component: 'ErrorBoundary',
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-left">
              <details className="bg-gray-100 rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-gray-900">Error Details</summary>
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>Error:</strong> {error.message}</p>
                  {error.stack && (
                    <div className="mt-2">
                      <strong>Stack:</strong>
                      <pre className="mt-1 text-xs overflow-auto max-h-32">{error.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
          <div className="mt-6 space-y-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}