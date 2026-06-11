
"use client"

import { useMemo } from 'react';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function AdminDashboardPage() {
  const db = useFirestore();

  const complaintsQuery = useMemo(() => query(collection(db, "complaints"), orderBy("createdAt", "desc")), [db]);
  const usersQuery = useMemo(() => query(collection(db, "users"), limit(100)), [db]);

  const { data: complaints, loading: complaintsLoading } = useCollection(complaintsQuery);
  const { data: users, loading: usersLoading } = useCollection(usersQuery);

  const stats = useMemo(() => {
    if (!complaints) return { total: 0, pending: 0, inProgress: 0, resolved: 0 };
    return {
      total: complaints.length,
      pending: complaints.filter(c => c.status === "Pending").length,
      inProgress: complaints.filter(c => c.status === "In Progress").length,
      resolved: complaints.filter(c => c.status === "Resolved").length,
    };
  }, [complaints]);

  const categoryData = useMemo(() => {
    if (!complaints) return [];
    const counts: Record<string, number> = {};
    complaints.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [complaints]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-slate-900">System Overview</h1>
          <p className="text-muted-foreground">Welcome to the E-Swacch management dashboard.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/admin/complaints">Manage All Reports</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Reports" value={stats.total} icon={<FileText className="text-blue-500" />} />
        <StatCard label="Pending Review" value={stats.pending} icon={<Clock className="text-orange-500" />} color="text-orange-600" />
        <StatCard label="In Maintenance" value={stats.inProgress} icon={<TrendingUp className="text-purple-500" />} color="text-purple-600" />
        <StatCard label="Total Citizens" value={users?.length || 0} icon={<Users className="text-emerald-500" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Reports by Category</CardTitle>
            <CardDescription>Volume of civic issues across different departments.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Reports</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-primary h-8 p-0 hover:bg-transparent">
                <Link href="/admin/complaints">View All <ArrowRight size={14} className="ml-1" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {complaints?.slice(0, 5).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors group">
                <div className="flex flex-col gap-1 overflow-hidden">
                  <span className="text-sm font-bold text-slate-900 truncate">{c.title}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{c.category}</span>
                </div>
                <Badge className={cn("text-[10px] px-2", getStatusColor(c.status))}>{c.status}</Badge>
              </div>
            ))}
            {!complaintsLoading && complaints?.length === 0 && (
              <div className="py-12 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-slate-200" />
                <p className="text-slate-400 text-sm mt-2">No reports to display</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = "text-slate-900" }: any) {
  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        </div>
        <p className={`text-3xl font-headline font-extrabold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Pending': return 'bg-slate-100 text-slate-600';
    case 'In Review': return 'bg-blue-100 text-blue-600';
    case 'Assigned': return 'bg-purple-100 text-purple-600';
    case 'In Progress': return 'bg-orange-100 text-orange-600';
    case 'Resolved': return 'bg-green-100 text-green-600';
    default: return 'bg-slate-100 text-slate-600';
  }
}
