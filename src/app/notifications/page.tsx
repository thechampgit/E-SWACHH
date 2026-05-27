
'use client';

import React, { useMemo } from 'react';
import { collection, query, where, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { 
  Bell, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  ArrowLeft,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const db = useFirestore();
  const { user } = useUser();

  const notificationsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);

  const { data: notifications, loading } = useCollection(notificationsQuery);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'notifications', id));
  };

  const handleMarkRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'resolved': return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'alert': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 lg:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <Link href="/dashboard" className="text-primary hover:underline text-sm flex items-center gap-1 mb-2">
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-headline font-bold text-slate-900">Activity History</h1>
            <p className="text-muted-foreground">Stay updated on your civic reports and system alerts.</p>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse h-24 bg-white border-none" />
            ))
          ) : !notifications || notifications.length === 0 ? (
            <Card className="border-none shadow-sm bg-white py-20">
              <CardContent className="flex flex-col items-center gap-4">
                <Bell size={48} className="text-slate-200" strokeWidth={1} />
                <h3 className="text-lg font-bold text-slate-900">No activity yet</h3>
                <p className="text-slate-400 text-sm">Notifications will appear here as your reports are processed.</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((n) => (
              <Card 
                key={n.id} 
                className={cn(
                  "border-none shadow-sm transition-all hover:shadow-md",
                  !n.read ? "bg-white ring-1 ring-primary/10" : "bg-white/80"
                )}
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="mt-1 shrink-0 p-2 bg-slate-50 rounded-lg">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={cn("text-sm font-bold truncate", !n.read ? "text-slate-900" : "text-slate-600")}>
                        {n.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {n.createdAt?.toDate() ? format(n.createdAt.toDate(), 'MMM d, h:mm a') : 'Recent'}
                        </span>
                        {!n.read && (
                          <Badge variant="default" className="text-[8px] h-4 px-1 leading-none uppercase tracking-tighter">New</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3 pt-3">
                      {n.complaintId && (
                        <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold" asChild>
                          <Link href={`/track/${n.complaintId}`}>Track Report</Link>
                        </Button>
                      )}
                      {!n.read && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-[10px] font-bold text-primary hover:bg-primary/5"
                          onClick={() => handleMarkRead(n.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[10px] font-bold text-destructive hover:bg-destructive/5"
                        onClick={() => handleDelete(n.id)}
                      >
                        <Trash2 size={12} className="mr-1" /> Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
