import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in the component tree.
 * Displays user-friendly error UI and provides option to retry.
 *
 * Error boundaries must be class components as they rely on lifecycle methods
 * (componentDidCatch and getDerivedStateFromError) not available in hooks.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console for development debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Reload the page to reset the application state
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
            {/* Error icon */}
            <div className="flex justify-center mb-6">
              <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 dark:text-red-400 text-4xl">
                  error
                </span>
              </div>
            </div>

            {/* Error heading */}
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Something went wrong
            </h1>

            {/* Error message */}
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>

            {/* Retry button */}
            <button
              onClick={this.handleRetry}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-xl">refresh</span>
              Reload Page
            </button>

            {/* Error details (collapsible for debugging) */}
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                  Error details (for debugging)
                </summary>
                <div className="mt-3 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-auto max-h-48">
                  <p className="text-xs font-mono text-red-600 dark:text-red-400 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
