"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  Search, 
  Map as MapIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  TrendingUp,
  LayoutGrid,
  Filter
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"), limit(20));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(docs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const stats = {
    total: complaints.length,
    resolved: complaints.filter(c => c.status === "Resolved").length,
    pending: complaints.filter(c => c.status === "Pending").length,
    active: complaints.filter(c => !["Resolved", "Pending"].includes(c.status)).length
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
              C
            </div>
            <span className="text-xl font-headline font-bold text-primary">CivicPulse</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link href="/map">
                <MapIcon className="mr-2 h-4 w-4" /> View Map
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/report">
                <PlusCircle className="mr-2 h-4 w-4" /> New Report
              </Link>
            </Button>
            <div className="w-8 h-8 rounded-full bg-slate-200 border flex items-center justify-center text-xs font-bold">
              JD
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        {/* Welcome & Stats */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="bg-primary rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <h1 className="text-3xl font-headline font-bold">Welcome back, Citizen!</h1>
                <p className="text-primary-foreground/80 max-w-md">Your contributions are making our city better every day. Check the status of your reported issues below.</p>
                <div className="flex gap-4 pt-2">
                  <Button variant="secondary" size="lg" asChild>
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
            <StatCard label="Response Rate" value="98%" icon={<TrendingUp className="text-purple-500" />} color="purple" />
          </div>
        </div>

        {/* Complaints Listing */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-headline font-bold text-slate-900">Recent Reports</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-slate-500">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="all">All Issues</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="pt-4">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Clock className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : complaints.length === 0 ? (
                <Card className="border-2 border-dashed p-12 text-center bg-white">
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
                  {complaints.map((c) => (
                    <ComplaintCard key={c.id} complaint={c} />
                  ))}
                </div>
              )}
            </TabsContent>
            {/* Other tabs would filter the same data */}
          </Tabs>
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
    <Card className="border shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group">
      {complaint.imageUrl && (
        <div className="h-40 w-full overflow-hidden border-b">
          <img src={complaint.imageUrl} alt={complaint.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <CardHeader className="p-5 pb-2">
        <div className="flex items-center justify-between gap-4 mb-2">
          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight">{complaint.category}</Badge>
          <Badge className={`text-[10px] uppercase font-bold ${statusColors[complaint.status || "Pending"]}`}>
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
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {complaint.location}
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

import { MapPin } from 'lucide-react';