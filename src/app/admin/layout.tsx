
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminSidebar } from '@/components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex min-h-screen bg-slate-50/50">
        <AdminSidebar />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
