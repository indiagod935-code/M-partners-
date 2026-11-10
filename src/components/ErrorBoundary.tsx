import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled Application Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-200 shadow-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold">
                <span>M-PARTNER</span>
                <span>•</span>
                <span>System Protection</span>
              </div>
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                An unexpected hiccup occurred
              </h1>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Your session and data are secure. We encountered an unexpected issue while rendering this view.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-neutral-100 rounded-xl text-left overflow-hidden">
                <p className="text-xs font-mono text-neutral-700 truncate">
                  {this.state.error.message || 'Unknown runtime error'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full py-2.5 px-4 rounded-xl border border-neutral-300 text-neutral-800 text-xs font-semibold hover:bg-neutral-100 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go to Home</span>
              </button>
            </div>

            <p className="text-[11px] text-neutral-400">
              Powered by Mãrçò 💯 • M-PARTNER Platform
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
