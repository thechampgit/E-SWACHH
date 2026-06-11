'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useAuth, useMemoFirebase } from '@/firebase';
import { useLogoutConfirm } from '@/context/LogoutConfirmContext';
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
  Clock,
  User,
  Trophy,
  Gift,
  LayoutDashboard
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

  const { confirmLogout } = useLogoutConfirm();

  const handleLogout = async () => {
    confirmLogout(async () => {
      if (!auth) return;
      await signOut(auth);
      router.push('/');
    });
  };

  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-350 bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/portal_bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <header className="fixed top-0 z-[100] w-full border-b dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md h-16">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="E-Swachh Logo" className="w-8 h-8 object-contain rounded-md" />
            <span className="text-lg font-headline font-bold text-slate-900 dark:text-slate-100">E-Swachh</span>
          </Link>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/profile" title="View Profile">
                <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:text-destructive hover:bg-destructive/10" title="Logout">
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
            <p className="text-sm text-slate-600">Monitor your civic reports and track neighborhood impact.</p>
          </div>
          <Button asChild>
            <Link href="/report">
              <PlusCircle className="mr-2 h-4 w-4" /> New Report
            </Link>
          </Button>
        </div>

        {/* SUB-NAVIGATION TABS */}
        <div className="border-b border-slate-200">
          <div className="flex gap-8">
            <Link 
              href="/dashboard" 
              className="border-b-2 border-cyan-600 pb-3 text-sm font-bold text-cyan-600 flex items-center gap-2 transition-all"
            >
              <LayoutDashboard className="h-4 w-4" /> My Dashboard
            </Link>
            <Link 
              href="/dashboard/leaderboard" 
              className="border-b-2 border-transparent pb-3 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:border-slate-400 flex items-center gap-2 transition-all"
            >
              <Trophy className="h-4 w-4" /> Swachh Warriors
            </Link>
            <Link 
              href="/dashboard/rewards" 
              className="border-b-2 border-transparent pb-3 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:border-slate-400 flex items-center gap-2 transition-all"
            >
              <Gift className="h-4 w-4" /> Eco Rewards
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Reports" value={stats.total} icon={<Activity className="text-blue-500" />} />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="text-emerald-500" />} />
          <StatCard label="Points Earned" value={stats.total * 10} icon={<Trophy className="text-amber-500 animate-pulse" />} href="/dashboard/rewards" />
          <StatCard label="In Progress" value={stats.total - stats.resolved} icon={<Clock className="text-slate-500" />} />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-headline font-bold text-slate-900 dark:text-slate-100">Recent Activity</h2>
            <Button variant="ghost" size="sm" asChild className="text-primary font-bold">
              <Link href="/my-reports">View All <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center bg-white rounded-xl border border-dashed">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : complaints?.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-12 text-center space-y-4">
              <AlertCircle className="mx-auto h-12 w-12 text-slate-200 dark:text-slate-800" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No reports found</h3>
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

function StatCard({ label, value, icon, href }: any) {
  const cardContent = (
    <Card className={`shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full ${href ? "hover:shadow-md hover:border-amber-500/50 transition-all cursor-pointer group/stat" : ""}`}>
      <CardContent className="p-6 flex items-center gap-4">
        <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg group-hover/stat:bg-amber-50 transition-colors">{icon}</div>
        <div>
          <p className="text-2xl font-headline font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
            {value}
            {href && <ArrowUpRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover/stat:text-amber-500 group-hover/stat:translate-x-0.5 group-hover/stat:-translate-y-0.5 transition-all" />}
          </p>
          <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-550 tracking-wider">{label}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href} className="block h-full">{cardContent}</Link>;
  }
  return cardContent;
}

function ComplaintCard({ complaint }: any) {
  const statusColors: any = {
    "Pending": "bg-slate-100 text-slate-600 border-slate-200",
    "In Progress": "bg-blue-50 text-blue-600 border-blue-100",
    "Resolved": "bg-emerald-50 text-emerald-600 border-emerald-100",
  };
  const locationAddress = typeof complaint.location === 'string'
    ? complaint.location
    : complaint.location?.address || 'Location provided';

  return (
    <Card className="group overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary/50 transition-all bg-white dark:bg-slate-900">
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
        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{complaint.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <MapPin size={12} className="text-slate-400 dark:text-slate-500" /> {locationAddress}
        </div>
        <Button className="w-full h-9 text-xs" variant="secondary" asChild>
          <Link href={`/track/${complaint.id}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

