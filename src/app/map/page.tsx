
"use client"

import { useState, useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { MapProvider } from '@/components/MapProvider';
import { MainMap } from '@/components/MainMap';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  Layers, 
  Map as MapIcon, 
  PlusCircle, 
  Search,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function PublicMapPage() {
  const db = useFirestore();
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const { data: complaints, loading } = useCollection(
    query(collection(db, "complaints"), orderBy("createdAt", "desc"))
  );

  const filteredComplaints = useMemo(() => {
    if (!complaints) return [];
    return complaints.filter(c => {
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
      const hasCoords = c.location?.latitude && c.location?.longitude;
      return matchesStatus && matchesCategory && hasCoords;
    });
  }, [complaints, statusFilter, categoryFilter]);

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b px-6 h-16 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-primary hover:bg-slate-50 p-2 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">C</div>
            <h1 className="text-xl font-headline font-bold text-slate-900 hidden sm:block">Impact Map</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant={showHeatmap ? "default" : "outline"} size="sm" onClick={() => setShowHeatmap(!showHeatmap)}>
            <Layers className="mr-2 h-4 w-4" /> {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
          </Button>
          <Button size="sm" asChild>
            <Link href="/report">
              <PlusCircle className="mr-2 h-4 w-4" /> Report Issue
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        {/* Map Sidebar / Controls */}
        <aside className="w-full md:w-80 bg-white border-r p-6 shrink-0 z-10 overflow-y-auto">
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Filter View</h2>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Category</label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Road Damage', 'Garbage', 'Water Supply', 'Electricity', 'Streetlight', 'Drainage'].map(cat => (
                    <Badge 
                      key={cat} 
                      variant={categoryFilter === cat ? "default" : "outline"}
                      className="cursor-pointer text-[10px] px-2 py-1"
                      onClick={() => setCategoryFilter(cat)}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Status</label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Pending', 'In Progress', 'Resolved'].map(status => (
                    <Badge 
                      key={status} 
                      variant={statusFilter === status ? "default" : "outline"}
                      className="cursor-pointer text-[10px] px-2 py-1"
                      onClick={() => setStatusFilter(status)}
                    >
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Active Reports ({filteredComplaints.length})</h2>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredComplaints.slice(0, 10).map((c: any) => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-primary/20 transition-colors cursor-pointer group">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors truncate">{c.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{c.location.address}</p>
                    </div>
                  ))}
                  {filteredComplaints.length > 10 && (
                    <p className="text-[10px] text-center text-slate-400 italic">Showing top 10 results</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Map Container */}
        <main className="flex-1 h-full">
          <MapProvider>
            <MainMap complaints={filteredComplaints} showHeatmap={showHeatmap} />
          </MapProvider>
        </main>
      </div>
    </div>
  );
}
