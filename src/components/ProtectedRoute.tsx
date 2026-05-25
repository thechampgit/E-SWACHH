'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'citizen' | 'admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: userData, loading: docLoading } = useDoc<any>(userDocRef);

  const loading = authLoading || (!!user && docLoading);

  useEffect(() => {
    // Increased timeout to 15s to accommodate slow network/cold starts
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('ProtectedRoute: Auth or Doc loading timed out after 15s');
        setTimedOut(true);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requiredRole && userData && userData.role !== requiredRole) {
        if (userData.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [user, loading, requiredRole, userData?.role, router]);

  if (timedOut && loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Connection is taking longer than expected</h2>
        <p className="text-slate-500 mb-6 max-w-sm">We're having trouble reaching the governance servers. This might be due to a slow connection.</p>
        <Button onClick={() => window.location.reload()} className="gap-2">
          <RefreshCcw size={16} /> Retry Connection
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verifying Identity</span>
        </div>
      </div>
    );
  }

  if (!user || (requiredRole && userData?.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
