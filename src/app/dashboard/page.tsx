
"use client"

import { useMemo } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  Map as MapIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  TrendingUp,
  LayoutGrid,
  MapPin,
  LogOut,
  List
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { NotificationCenter } from '@/components/NotificationCenter';

export default function DashboardPage() {
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const complaintsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "complaints"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"), 
      limit(20)
    );
  }, [db, user]);

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
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
              C
            </div>
            <span className="text-xl font-headline font-bold text-primary">CivicPulse</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationCenter />
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link href="/my-reports">
                <List className="mr-2 h-4 w-4" /> My Reports
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/report">
                <PlusCircle className="mr-2 h-4 w-4" /> New Report
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="bg-primary rounded-2xl p-8 text-white relative overflow-hidden shadow-xl ring-4 ring-primary/5">
              <div className="relative z-10 space-y-4">
                <h1 className="text-3xl font-headline font-bold">
                  Welcome back, {user?.displayName || 'Citizen'}!
                </h1>
                <p className="text-primary-foreground/80 max-w-md">Your contributions are making our city better every day. Track your recent reports below.</p>
                <div className="flex gap-4 pt-2">
                  <Button variant="secondary" size="lg" asChild className="font-bold">
                    <Link href="/report">Report New Issue</Link>
                  </Button>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
                <LayoutGrid size={320} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:w-[400px]">
            <StatCard label="Total Filed" value={stats.total} icon={<Clock className="text-blue-500" />} color="blue" />
            <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="text-green-500" />} color="green" />
            <StatCard label="Pending" value={stats.pending} icon={<AlertCircle className="text-orange-500" />} color="orange" />
            <StatCard label="Active" value={stats.total - stats.resolved} icon={<TrendingUp className="text-purple-500" />} color="purple" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-headline font-bold text-slate-900">Your Recent Reports</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="font-bold text-primary">
                <Link href="/my-reports">
                  View All <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !complaints || complaints.length === 0 ? (
            <Card className="border-2 border-dashed p-12 text-center bg-white shadow-sm">
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="h-12 w-12 text-slate-300" />
                <h3 className="text-xl font-bold">No issues reported yet</h3>
                <p className="text-muted-foreground">Your recent activity will appear here once you start reporting.</p>
                <Button asChild>
                  <Link href="/report">Submit Your First Report</Link>
                </Button>
              </div>
            </Card>
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

function StatCard({ label, value, icon, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 border-blue-100",
    green: "bg-green-50 border-green-100",
    orange: "bg-orange-50 border-orange-100",
    purple: "bg-purple-50 border-purple-100",
  };
  return (
    <Card className={`border-none shadow-sm ${colorMap[color]}`}>
      <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
        <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
        <div>
          <p className="text-3xl font-headline font-bold text-slate-800">{value}</p>
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ComplaintCard({ complaint }: any) {
  const statusColors: any = {
    "Pending": "bg-slate-100 text-slate-700",
    "In Review": "bg-blue-100 text-blue-700",
    "Assigned": "bg-purple-100 text-purple-700",
    "In Progress": "bg-orange-100 text-orange-700",
    "Resolved": "bg-green-100 text-green-700",
  };

  return (
    <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white overflow-hidden group">
      {complaint.imageUrl && (
        <div className="h-40 w-full overflow-hidden border-b">
          <img src={complaint.imageUrl} alt={complaint.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        </div>
      )}
      <CardHeader className="p-5 pb-2">
        <div className="flex items-center justify-between gap-4 mb-2">
          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight px-2">{complaint.category}</Badge>
          <Badge className={`text-[10px] uppercase font-bold px-2 ${statusColors[complaint.status || "Pending"]}`}>
            {complaint.status || "Pending"}
          </Badge>
        </div>
        <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">{complaint.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-4">
        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
          {complaint.description}
        </p>
        <div className="flex items-center justify-between pt-2 border-t text-[11px] font-medium text-slate-400">
          <span className="flex items-center gap-1 max-w-[150px] truncate">
            <MapPin size={12} /> {complaint.location?.address || 'Location Hidden'}
          </span>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider text-primary px-0 hover:bg-transparent" asChild>
            <Link href={`/track/${complaint.id}`}>
              Track Details <ArrowUpRight size={14} className="ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
