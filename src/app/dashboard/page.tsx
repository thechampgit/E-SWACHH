
"use client"

import { useMemo } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useAuth, useMemoFirebase } from '@/firebase';
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
  Award,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { NotificationCenter } from '@/components/NotificationCenter';
import { motion, AnimatePresence } from 'framer-motion';

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
      limit(20)
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
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      <header className="fixed top-0 z-[100] w-full border-b border-white/5 bg-background/60 backdrop-blur-xl h-20">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-cyan-400 flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)]">C</div>
            <span className="text-2xl font-headline font-bold text-white">CivicPulse</span>
          </Link>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:bg-white/5 text-white/60 hover:text-white">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 pt-32 pb-20 space-y-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <div className="relative rounded-[3rem] p-12 overflow-hidden bg-gradient-to-br from-primary/20 to-cyan-500/10 border border-white/10 shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-20"><Zap size={120} className="fill-primary" /></div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-none font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                    <Award className="mr-2 h-4 w-4" /> Elite Contributor
                  </Badge>
                </div>
                <h1 className="text-6xl font-headline font-black tracking-tight">
                  Welcome, <span className="text-primary">{user?.displayName?.split(' ')[0] || 'Citizen'}</span>
                </h1>
                <p className="text-xl text-white/50 max-w-md font-medium leading-relaxed">System status: All services operational. Your reports are currently fueling urban optimization.</p>
                <div className="flex gap-4 pt-4">
                  <Button size="lg" asChild className="font-bold rounded-2xl h-16 px-10 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                    <Link href="/report">New Pulsar Report</Link>
                  </Button>
                  <Button variant="outline" size="lg" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-2xl h-16 px-10 backdrop-blur-xl font-bold" asChild>
                    <Link href="/transparency">Global Metrics</Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-2 gap-4 lg:w-[480px]"
          >
            <StatCard label="Reports Logged" value={stats.total} icon={<Activity className="text-primary" />} />
            <StatCard label="City Resolved" value={stats.resolved} icon={<CheckCircle2 className="text-emerald-400" />} />
            <StatCard label="Pulsar Points" value={stats.total * 250} icon={<Award className="text-purple-400" />} />
            <StatCard label="Active Track" value={stats.total - stats.resolved} icon={<Zap className="text-amber-400" />} />
          </motion.div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-headline font-black flex items-center gap-3">
              <span className="w-1.5 h-8 bg-primary rounded-full" />
              Realtime Activity Stream
            </h2>
            <Button variant="ghost" size="sm" asChild className="font-bold text-primary hover:bg-primary/10 rounded-xl px-4">
              <Link href="/my-reports">Archives <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="py-20 flex justify-center"><div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full shadow-[0_0_20px_rgba(6,182,212,0.3)]" /></div>
            ) : complaints?.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-white/5 p-20 text-center bg-white/5 backdrop-blur-3xl rounded-[3rem] shadow-inner"
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-white/20"><AlertCircle size={48} /></div>
                  <h3 className="text-3xl font-black">No Active Pulsars</h3>
                  <p className="text-white/40 max-w-sm font-medium">Your city waits for your insight. Begin your first urban report to trigger the resolution pipeline.</p>
                  <Button asChild className="rounded-2xl h-14 px-8 font-bold" size="lg">
                    <Link href="/report">Launch First Report</Link>
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {complaints.map((c: any, index: number) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ComplaintCard complaint={c} />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <Card className="border border-white/5 shadow-2xl bg-white/5 backdrop-blur-3xl rounded-[2rem] hover:bg-white/10 transition-colors">
      <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-3">
        <div className="p-4 bg-white/5 rounded-2xl mb-1 shadow-inner">{icon}</div>
        <p className="text-4xl font-headline font-black tracking-tight">{value}</p>
        <p className="text-[10px] uppercase font-bold text-white/40 tracking-[0.2em]">{label}</p>
      </CardContent>
    </Card>
  );
}

function ComplaintCard({ complaint }: any) {
  const statusConfig: any = {
    "Pending": "bg-white/10 text-white/80 status-glow-pending",
    "In Progress": "bg-primary/20 text-primary status-glow-active",
    "Resolved": "bg-emerald-500/20 text-emerald-400 status-glow-resolved",
  };

  return (
    <motion.div whileHover={{ scale: 1.02, y: -5 }}>
      <Card className="border border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] bg-white/5 backdrop-blur-3xl overflow-hidden rounded-[2.5rem] group">
        {complaint.imageUrl && (
          <div className="h-48 w-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
            <img src={complaint.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute top-4 left-4 z-20">
              <Badge variant="secondary" className="bg-black/60 backdrop-blur-xl border-none font-black uppercase text-[10px] tracking-widest px-3 py-1 text-white">
                {complaint.category}
              </Badge>
            </div>
          </div>
        )}
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusConfig[complaint.status || "Pending"]}`}>
              {complaint.status || "Pending"}
            </div>
          </div>
          <CardTitle className="text-2xl font-black line-clamp-1 group-hover:text-primary transition-colors">{complaint.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-6">
          <div className="flex items-center gap-2 text-[11px] font-bold text-white/40 uppercase tracking-[0.1em]">
            <MapPin size={12} className="text-primary" /> {complaint.location?.address || 'Restricted Coords'}
          </div>
          <Button className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs bg-white/5 hover:bg-primary transition-all shadow-inner border border-white/5 group-hover:border-primary/20" variant="secondary" asChild>
            <Link href={`/track/${complaint.id}`}>Telemetry Details</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
