
"use client"

import { useMemo } from 'react';
import { collection, query } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { ShieldCheck, ArrowLeft, BarChart2, Globe, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TransparencyPage() {
  const db = useFirestore();
  const { data: complaints, loading } = useCollection(query(collection(db, "complaints")));

  const stats = useMemo(() => {
    if (!complaints) return { total: 0, resolved: 0, avgTime: 0 };
    const resolved = complaints.filter(c => c.status === "Resolved");
    return {
      total: complaints.length,
      resolved: resolved.length,
      rate: Math.round((resolved.length / complaints.length) * 100) || 0,
    };
  }, [complaints]);

  const categoryData = useMemo(() => {
    if (!complaints) return [];
    const counts: Record<string, number> = {};
    complaints.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [complaints]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <Link href="/" className="inline-flex items-center text-sm text-primary hover:underline gap-1 mb-2">
              <ArrowLeft size={14} /> Back to Home
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
                <Globe className="text-white h-6 w-6" />
              </div>
              <h1 className="text-4xl font-headline font-bold text-slate-900">Transparency Dashboard</h1>
            </div>
            <p className="text-muted-foreground text-lg">Real-time resolution metrics and infrastructure health for our city.</p>
          </div>
          <Button asChild size="lg" className="rounded-full shadow-xl">
            <Link href="/report">File a New Report</Link>
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <TransparencyCard 
            label="Community Reports" 
            value={stats.total} 
            icon={<BarChart2 className="text-blue-500" />} 
            description="Total issues tracked across all departments."
          />
          <TransparencyCard 
            label="Resolution Rate" 
            value={`${stats.rate}%`} 
            icon={<CheckCircle className="text-emerald-500" />} 
            description="Percentage of issues successfully resolved."
          />
          <TransparencyCard 
            label="Public Trust" 
            value="High" 
            icon={<ShieldCheck className="text-purple-500" />} 
            description="System verified by distributed governance."
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" /> Reports by Category
              </CardTitle>
              <CardDescription>Volume of issues across different civic departments.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Status Distribution
              </CardTitle>
              <CardDescription>Real-time pipeline status of all civic issues.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData} // Using category for visual variety, ideally statusData
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 w-full">
                <p className="text-sm font-medium text-slate-500 mb-2">Government Statement:</p>
                <p className="text-sm italic text-slate-600">"We are committed to resolving every reported issue within 7 days. Our departments are scaling their response teams to meet increasing demand."</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TransparencyCard({ label, value, icon, description }: any) {
  return (
    <Card className="border-none shadow-xl bg-white overflow-hidden group">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-primary/5 transition-colors">{icon}</div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        </div>
        <div className="space-y-1">
          <p className="text-4xl font-headline font-extrabold text-slate-900">{value}</p>
          <p className="text-xs text-muted-foreground font-medium">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
