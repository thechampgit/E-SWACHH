'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useAuth, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  Activity,
  MapPin,
  LogOut,
  Bell,
  Clock
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { NotificationCenter } from '@/components/NotificationCenter';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const complaintsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "complaints"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"), 
      limit(10)
    );
  }, [db, user?.uid]);

  const { data: complaints, loading } = useCollection(complaintsQuery);

  const stats = useMemo(() => {
    if (!complaints) return { total: 0, resolved: 0, pending: 0 };
    return {
      total: complaints.length,
      resolved: complaints.filter(c => c.status === "Resolved").length,
      pending: complaints.filter(c => c.status === "Pending").length,
    };
  }, [complaints]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="fixed top-0 z-[100] w-full border-b bg-white h-16">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">C</div>
            <span className="text-lg font-headline font-bold text-slate-900">CivicPulse</span>
          </Link>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 pt-24 pb-12 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-headline font-bold text-slate-900">
              Welcome, {user?.displayName?.split(' ')[0] || 'Citizen'}
            </h1>
            <p className="text-sm text-slate-500">Monitor your civic reports and track neighborhood impact.</p>
          </div>
          <Button asChild>
            <Link href="/report">
              <PlusCircle className="mr-2 h-4 w-4" /> New Report
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Reports" value={stats.total} icon={<Activity className="text-blue-500" />} />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="text-emerald-500" />} />
          <StatCard label="Points Earned" value={stats.total * 10} icon={<Activity className="text-amber-500" />} />
          <StatCard label="In Progress" value={stats.total - stats.resolved} icon={<Clock className="text-slate-500" />} />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-headline font-bold text-slate-900">Recent Activity</h2>
            <Button variant="ghost" size="sm" asChild className="text-primary font-bold">
              <Link href="/my-reports">View All <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center bg-white rounded-xl border border-dashed">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : complaints?.length === 0 ? (
            <div className="bg-white border rounded-xl p-12 text-center space-y-4">
              <AlertCircle className="mx-auto h-12 w-12 text-slate-200" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">No reports found</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">Help improve your neighborhood by reporting infrastructure issues as you see them.</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/report">Create Your First Report</Link>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {complaints.map((c: any) => (
                <ComplaintCard key={c.id} complaint={c} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <Card className="shadow-sm border border-slate-200">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        <div>
          <p className="text-2xl font-headline font-bold text-slate-900">{value}</p>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ComplaintCard({ complaint }: any) {
  const statusColors: any = {
    "Pending": "bg-slate-100 text-slate-600 border-slate-200",
    "In Progress": "bg-blue-50 text-blue-600 border-blue-100",
    "Resolved": "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <Card className="group overflow-hidden border border-slate-200 shadow-sm hover:border-primary/50 transition-all">
      {complaint.imageUrl && (
        <div className="h-40 w-full overflow-hidden border-b">
          <img src={complaint.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <CardHeader className="p-5 pb-2">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-[10px] font-bold uppercase">{complaint.category}</Badge>
          <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${statusColors[complaint.status || "Pending"]}`}>
            {complaint.status || "Pending"}
          </div>
        </div>
        <CardTitle className="text-base font-bold text-slate-900 line-clamp-1">{complaint.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin size={12} className="text-slate-400" /> {complaint.location?.address || 'Location provided'}
        </div>
        <Button className="w-full h-9 text-xs" variant="secondary" asChild>
          <Link href={`/track/${complaint.id}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
