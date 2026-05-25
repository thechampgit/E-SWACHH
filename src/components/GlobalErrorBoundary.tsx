'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <Card className="max-w-md w-full border-none shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-4">
                <AlertTriangle size={32} />
              </div>
              <CardTitle className="text-2xl font-headline font-bold">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <p className="text-slate-500">
                The application encountered an unexpected error. We've been notified and are working on it.
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full flex items-center justify-center gap-2"
              >
                <RefreshCcw size={16} /> Reload Application
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.children;
  }
}
