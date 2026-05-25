'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'citizen' | 'admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  // Use a stable doc ref for fetching user data to avoid infinite loops
  const userDocRef = user ? doc(db, 'users', user.uid) : null;
  const { data: userData, loading: docLoading } = useDoc<any>(userDocRef);

  const loading = authLoading || (user && docLoading);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requiredRole && userData && userData.role !== requiredRole) {
        // Redirect to their appropriate dashboard if they have the wrong role
        if (userData.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [user, loading, requiredRole, userData, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (requiredRole && userData?.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}