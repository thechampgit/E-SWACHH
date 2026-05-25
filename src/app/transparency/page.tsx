'use client';

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
import { Globe, ArrowLeft, BarChart2, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TransparencyPage() {
  const db = useFirestore();
  const { data: complaints, loading } = useCollection(query(collection(db, "complaints")));

  const stats = useMemo(() => {
    if (!complaints) return { total: 0, resolved: 0, rate: 0 };
    const resolved = complaints.filter(c => c.status === "Resolved");
    return {
      total: complaints.length,
      resolved: resolved.length,
      rate: complaints.length > 0 ? Math.round((resolved.length / complaints.length) * 100) : 0,
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

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="container mx-auto px-6 max-w-5xl">
        <header className="mb-12">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors mb-6">
            <ArrowLeft size={16} className="mr-1" /> Back to home
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-headline font-bold text-slate-900">Transparency Portal</h1>
              <p className="text-slate-500 text-lg">Monitoring municipal service delivery and infrastructure health.</p>
            </div>
            <Button asChild size="lg">
              <Link href="/report">File a Report</Link>
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <MetricCard 
            label="Total Reports" 
            value={stats.total} 
            icon={<BarChart2 className="text-blue-500" />} 
            description="Active tracked issues."
          />
          <MetricCard 
            label="Resolution Rate" 
            value={`${stats.rate}%`} 
            icon={<CheckCircle className="text-emerald-500" />} 
            description="Verified resolved cases."
          />
          <MetricCard 
            label="Accountability" 
            value="High" 
            icon={<ShieldCheck className="text-purple-500" />} 
            description="Third-party verified system."
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="shadow-sm border border-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg">Reports by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg">Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-6">
              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200 w-full">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Public Commitment</p>
                <p className="text-sm italic text-slate-600">"We aim to respond to high-priority issues within 48 hours and resolve all valid reports within a standard 14-day window."</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, description }: any) {
  return (
    <Card className="shadow-sm border border-slate-200">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-slate-50 rounded-lg border">{icon}</div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        </div>
        <div className="space-y-1">
          <p className="text-4xl font-headline font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500 font-medium">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
