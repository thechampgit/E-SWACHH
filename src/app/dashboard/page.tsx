
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
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  TrendingUp,
  LayoutGrid,
  MapPin,
  LogOut,
  List,
  Award,
  ShieldCheck
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
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">C</div>
            <span className="text-xl font-headline font-bold text-primary">CivicPulse</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationCenter />
            <Button variant="outline" size="sm" asChild className="hidden sm:flex rounded-full">
              <Link href="/transparency"><ShieldCheck className="mr-2 h-4 w-4" /> Transparency</Link>
            </Button>
            <Button size="sm" asChild className="rounded-full">
              <Link href="/report"><PlusCircle className="mr-2 h-4 w-4" /> New Report</Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="bg-primary rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-none font-bold">
                    <Award className="mr-1 h-3 w-3" /> Civic Leader
                  </Badge>
                </div>
                <h1 className="text-4xl font-headline font-bold">
                  Good day, {user?.displayName || 'Citizen'}
                </h1>
                <p className="text-primary-foreground/80 max-w-md text-lg">Your reports help our city engineers prioritize the right infrastructure projects.</p>
                <div className="flex gap-4 pt-4">
                  <Button variant="secondary" size="lg" asChild className="font-bold rounded-full h-12 px-8">
                    <Link href="/report">File Report</Link>
                  </Button>
                  <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white/10 rounded-full h-12 px-8" asChild>
                    <Link href="/transparency">View Impact</Link>
                  </Button>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
                <LayoutGrid size={400} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:w-[450px]">
            <StatCard label="Reports Filed" value={stats.total} icon={<Clock className="text-blue-500" />} />
            <StatCard label="City Resolved" value={stats.resolved} icon={<CheckCircle2 className="text-emerald-500" />} />
            <StatCard label="Civic Points" value={stats.total * 10} icon={<Award className="text-purple-500" />} />
            <StatCard label="Active Track" value={stats.total - stats.resolved} icon={<TrendingUp className="text-orange-500" />} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-headline font-bold text-slate-900">Live Governance Track</h2>
            <Button variant="ghost" size="sm" asChild className="font-bold text-primary hover:bg-primary/5">
              <Link href="/my-reports">Manage All <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : complaints?.length === 0 ? (
            <Card className="border-2 border-dashed p-16 text-center bg-white rounded-3xl shadow-sm">
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="h-14 w-14 text-slate-200" />
                <h3 className="text-2xl font-bold">No active reports</h3>
                <p className="text-slate-400 max-w-sm">Help improve our community by reporting issues like potholes or water leaks.</p>
                <Button asChild className="rounded-full" size="lg">
                  <Link href="/report">Submit First Report</Link>
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

function StatCard({ label, value, icon }: any) {
  return (
    <Card className="border-none shadow-sm bg-white rounded-2xl">
      <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
        <div className="p-3 bg-slate-50 rounded-xl mb-1">{icon}</div>
        <p className="text-3xl font-headline font-bold text-slate-900">{value}</p>
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{label}</p>
      </CardContent>
    </Card>
  );
}

function ComplaintCard({ complaint }: any) {
  const statusColors: any = {
    "Pending": "bg-slate-100 text-slate-700",
    "In Progress": "bg-orange-100 text-orange-700",
    "Resolved": "bg-green-100 text-green-700",
  };

  return (
    <Card className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden rounded-2xl group">
      {complaint.imageUrl && (
        <div className="h-44 w-full overflow-hidden">
          <img src={complaint.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        </div>
      )}
      <CardHeader className="p-6 pb-2">
        <div className="flex items-center justify-between gap-4 mb-3">
          <Badge variant="outline" className="text-[10px] font-bold px-3 py-1 uppercase">{complaint.category}</Badge>
          <Badge className={`text-[10px] font-bold px-3 py-1 uppercase border-none ${statusColors[complaint.status || "Pending"]}`}>
            {complaint.status || "Pending"}
          </Badge>
        </div>
        <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors">{complaint.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
          <MapPin size={12} className="text-primary" /> {complaint.location?.address || 'Location Hidden'}
        </div>
        <Button className="w-full rounded-full h-10 font-bold" variant="secondary" asChild>
          <Link href={`/track/${complaint.id}`}>View Tracking Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
