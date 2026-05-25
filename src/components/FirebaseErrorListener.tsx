'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // In a real production app, you might log this to Sentry.
      // In development, Next.js will show the error overlay if we throw it.
      console.error('Firebase Permission Error:', error.context);
      
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: `You do not have permission to ${error.context.operation} at ${error.context.path}`,
      });

      // Throwing the error here will trigger the Next.js error overlay in development.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}