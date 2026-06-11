'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL RUNTIME ERROR:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <Card className="max-w-md w-full border-none shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-4">
                <ShieldAlert size={32} />
              </div>
              <CardTitle className="text-2xl font-headline font-bold text-slate-900">Application Failure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-slate-500 text-sm">
                  E-Swachh encountered a critical runtime error. This has been logged for our engineering team.
                </p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mt-4 p-3 bg-slate-900 rounded-md text-left overflow-x-auto">
                    <code className="text-[10px] text-red-400 font-mono block whitespace-pre-wrap">
                      {this.state.error.name}: {this.state.error.message}
                    </code>
                  </div>
                )}
              </div>
              <Button 
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }} 
                className="w-full flex items-center justify-center gap-2 h-12 font-bold"
              >
                <RefreshCcw size={16} /> Recover Application
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
