'use client';

import React from 'react';
import { logger } from '@/lib/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Log the error
    logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      userId: (window as any).__userId,
      sessionId: (window as any).__sessionId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In development, you might want to show more details
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      // Default fallback UI
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
                      <p><strong>Error:</strong> {this.state.error?.message}</p>
                      {this.state.errorInfo && (
                        <div className="mt-2">
                          <strong>Component Stack:</strong>
                          <pre className="mt-1 text-xs overflow-auto max-h-32">{this.state.errorInfo.componentStack}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}
              <div className="mt-6">
                <button
                  onClick={this.resetError}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global error handler
export function setupGlobalErrorHandlers() {
  // Handle uncaught promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason, {
      type: 'unhandledrejection',
      userId: (window as any).__userId,
      sessionId: (window as any).__sessionId,
    });
  });

  // Handle JavaScript errors
  window.addEventListener('error', (event) => {
    logger.error('Global JavaScript error', event.error, {
      type: 'error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      message: event.message,
      userId: (window as any).__userId,
      sessionId: (window as any).__sessionId,
    });
  });
}

// Error recovery utilities
export class ErrorRecovery {
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    backoffMs = 1000,
    operationName = 'operation'
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 0) {
          logger.info(`Operation succeeded after ${attempt} retries`, { operationName });
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          logger.error(`Operation failed after ${maxRetries} retries`, lastError, {
            operationName,
            attempt: attempt + 1,
          });
          throw lastError;
        }

        const delay = backoffMs * Math.pow(2, attempt); // Exponential backoff
        logger.warn(`Operation failed, retrying in ${delay}ms`, {
          operationName,
          attempt: attempt + 1,
          error: lastError.message,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  static isNetworkError(error: any): boolean {
    return (
      error instanceof TypeError &&
      (error.message.includes('fetch') || 
       error.message.includes('network') || 
       error.message.includes('Failed to fetch'))
    );
  }

  static isRetryableError(error: any): boolean {
    // Check for retryable HTTP status codes
    if (error.status) {
      const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
      return retryableStatusCodes.includes(error.status);
    }

    // Check for network errors
    if (this.isNetworkError(error)) {
      return true;
    }

    // Check for specific error messages
    const retryableMessages = [
      'timeout',
      'network',
      'connection',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
    ];

    return retryableMessages.some(msg => 
      error.message?.toLowerCase().includes(msg)
    );
  }
}