import React, { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            <p className="text-slate-400 mb-6">
              An unexpected error occurred. Please try reloading the page.
            </p>
            {this.state.error && (
              <details className="text-left mb-6">
                <summary className="text-slate-400 cursor-pointer hover:text-slate-300 text-sm">
                  Error details
                </summary>
                <pre className="mt-2 p-4 bg-slate-900 rounded-lg text-red-400 text-xs overflow-auto max-h-48">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReload}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
