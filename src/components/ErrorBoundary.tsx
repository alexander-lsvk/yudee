import React from 'react';
import * as Sentry from "@sentry/react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultFallback = ({ error }: { error: Error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
      <h2 className="text-2xl font-semibold text-red-600 mb-4">Something went wrong</h2>
      <p className="text-gray-600 mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      >
        Reload page
      </button>
    </div>
  </div>
);

export const ErrorBoundary = Sentry.withErrorBoundary(
  ({ children, fallback }: Props) => {
    return <>{children}</>;
  },
  {
    fallback: ({ error }) => fallback || <DefaultFallback error={error} />,
  }
);