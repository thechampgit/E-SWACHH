
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
import { Loader2, TrendingUp, Award, Clock, FileCheck } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const db = useFirestore();
  const { data: complaints, loading } = useCollection(query(collection(db, "complaints")));

  const statusData = useMemo(() => {
    if (!complaints) return [];
    const counts: Record<string, number> = {};
    complaints.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [complaints]);

  const priorityData = useMemo(() => {
    if (!complaints) return [];
    const counts: Record<string, number> = { High: 0, Medium: 0, Low: 0 };
    complaints.forEach(c => {
      if (counts.hasOwnProperty(c.priority)) {
        counts[c.priority]++;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [complaints]);

  const resolutionRate = useMemo(() => {
    if (!complaints || complaints.length === 0) return 0;
    const resolved = complaints.filter(c => c.status === "Resolved").length;
    return Math.round((resolved / complaints.length) * 100);
  }, [complaints]);

  const STATUS_COLORS = {
    'Pending': '#94a3b8',
    'In Review': '#3b82f6',
    'Assigned': '#8b5cf6',
    'In Progress': '#f59e0b',
    'Resolved': '#10b981'
  };

  const PRIORITY_COLORS = {
    'High': '#ef4444',
    'Medium': '#f59e0b',
    'Low': '#3b82f6'
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-headline font-bold text-slate-900">Performance Analytics</h1>
        <p className="text-muted-foreground">Deep dive into civic response and resolution metrics.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <MetricCard title="Resolution Rate" value={`${resolutionRate}%`} icon={<Award className="text-emerald-500" />} description="Percentage of complaints marked as Resolved." />
        <MetricCard title="Avg. Review Time" value="2.4 days" icon={<Clock className="text-blue-500" />} description="Average time from report to In Review." />
        <MetricCard title="Action Required" value={complaints?.filter(c => c.status === "Pending").length || 0} icon={<FileCheck className="text-orange-500" />} description="New reports awaiting initial review." />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Reports by Status</CardTitle>
            <CardDescription>Current distribution of report stages.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#ccc'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Priority Distribution</CardTitle>
            <CardDescription>Urgency levels across all reports.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} width={60} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS] || '#ccc'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, description }: any) {
  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-50 rounded-lg group-hover:scale-110 transition-transform">{icon}</div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
        </div>
        <div className="space-y-1">
          <p className="text-4xl font-headline font-extrabold text-slate-900">{value}</p>
          <p className="text-[10px] text-muted-foreground font-medium">{description}</p>
        </div>
      </CardContent>
      <div className="absolute right-0 bottom-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
        <TrendingUp size={80} />
      </div>
    </Card>
  );
}
