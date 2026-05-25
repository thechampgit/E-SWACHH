
"use client"

import { useState, useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { MapProvider } from '@/components/MapProvider';
import { MainMap } from '@/components/MainMap';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Layers, 
  MapPin, 
  AlertCircle,
  TrendingUp,
  Activity,
  Filter
} from 'lucide-react';

export default function AdminMapPage() {
  const db = useFirestore();
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const { data: complaints, loading } = useCollection(
    query(collection(db, "complaints"), orderBy("createdAt", "desc"))
  );

  const filteredComplaints = useMemo(() => {
    if (!complaints) return [];
    return complaints.filter(c => {
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      const hasCoords = c.location?.latitude && c.location?.longitude;
      return matchesStatus && hasCoords;
    });
  }, [complaints, statusFilter]);

  const stats = useMemo(() => {
    if (!filteredComplaints) return { total: 0, highPriority: 0 };
    return {
      total: filteredComplaints.length,
      highPriority: filteredComplaints.filter(c => c.priority === 'High').length,
      unresolved: filteredComplaints.filter(c => c.status !== 'Resolved').length,
    };
  }, [filteredComplaints]);

  return (
    <div className="p-8 space-y-8 h-full max-w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold text-slate-900">Spatial Monitoring</h1>
          <p className="text-muted-foreground">Geographic distribution of reported civic issues.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border rounded-lg p-1 shadow-sm">
            {['All', 'Pending', 'In Progress', 'Resolved'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${
                  statusFilter === s ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold transition-all shadow-sm ${
              showHeatmap ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers size={14} /> {showHeatmap ? "Disable Heatmap" : "Enable Heatmap"}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <MetricSmall label="Tracked on Map" value={stats.total} icon={<MapPin className="text-blue-500" />} />
        <MetricSmall label="Spatial Hotspots" value={stats.highPriority} icon={<AlertCircle className="text-red-500" />} color="text-red-600" />
        <MetricSmall label="Live Unresolved" value={stats.unresolved} icon={<Activity className="text-orange-500" />} color="text-orange-600" />
      </div>

      <div className="h-[65vh] w-full">
        <MapProvider>
          <MainMap complaints={filteredComplaints} showHeatmap={showHeatmap} />
        </MapProvider>
      </div>
    </div>
  );
}

function MetricSmall({ label, value, icon, color = "text-slate-900" }: any) {
  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className={`text-2xl font-headline font-extrabold ${color}`}>{value}</p>
        </div>
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      </CardContent>
    </Card>
  );
}
