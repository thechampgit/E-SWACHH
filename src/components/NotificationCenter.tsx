'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  writeBatch 
} from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMessaging, requestNotificationPermission } from '@/firebase';
import { 
  Bell, 
  Inbox, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export function NotificationCenter() {
  const db = useFirestore();
  const { user } = useUser();
  const messaging = useMessaging();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user && messaging) {
      requestNotificationPermission(messaging);
    }
  }, [user, messaging]);

  const notificationsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }, [db, user]);

  const { data: notifications, loading } = useCollection(notificationsQuery);

  const unreadCount = useMemo(() => {
    return notifications?.filter(n => !n.read).length || 0;
  }, [notifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    const ref = doc(db, 'notifications', notificationId);
    await updateDoc(ref, { read: true });
  };

  const handleMarkAllAsRead = async () => {
    if (!notifications || !user) return;
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => {
      const ref = doc(db, 'notifications', n.id);
      batch.update(ref, { read: true });
    });
    await batch.commit();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white border-2 border-white animate-in zoom-in"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 border-none shadow-2xl">
        <DropdownMenuLabel className="p-4 flex items-center justify-between bg-slate-50/50">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold">Notifications</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Real-time alerts</span>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="h-7 text-[10px] font-bold uppercase tracking-tight text-primary hover:bg-primary/5"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <ScrollArea className="h-[350px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center opacity-40">
              <Inbox className="h-10 w-10 mb-2" strokeWidth={1} />
              <p className="text-xs font-medium">No new notifications</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div 
                  key={n.id}
                  className={cn(
                    "relative flex items-start gap-3 p-4 border-b border-slate-50 transition-colors hover:bg-slate-50 group",
                    !n.read && "bg-primary/[0.02]"
                  )}
                  onClick={() => !n.read && handleMarkAsRead(n.id)}
                >
                  <div className="mt-1 shrink-0">{getIcon(n.type)}</div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-xs font-bold truncate", !n.read ? "text-slate-900" : "text-slate-500")}>
                        {n.title}
                      </p>
                      <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                        {n.createdAt?.toDate() ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                    {n.complaintId && (
                      <Link 
                        href={`/track/${n.complaintId}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline pt-1"
                        onClick={() => setIsOpen(false)}
                      >
                        View Report <ExternalLink size={10} />
                      </Link>
                    )}
                  </div>
                  {!n.read && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem asChild>
          <Link 
            href="/notifications" 
            className="w-full flex items-center justify-center py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors cursor-pointer"
          >
            View all activity
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
