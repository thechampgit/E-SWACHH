'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { MapProvider } from '@/components/MapProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Layers, 
  PlusCircle, 
  ArrowLeft,
  Loader2,
  Compass,
  MapPin,
  Sparkles,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { usePreferences } from '@/context/PreferencesContext';

// Dynamically import MainMap
const MainMap = dynamic(
  () => import('@/components/MainMap').then((mod) => mod.MainMap),
  { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 dark:bg-slate-900 animate-pulse flex items-center justify-center text-slate-400">Initializing Map...</div>
  }
);

interface NearbyCenter {
  id: string;
  name: string;
  type: 'bio' | 'recycling' | 'smart-bin';
  coordinates: [number, number];
  fillLevel: number;
  distanceText: string;
  distanceVal: number;
}

// Generate mock waste/recycling hubs within a 2km radius of user coords
function generateMockCenters(lat: number, lng: number): NearbyCenter[] {
  const types: Array<'bio' | 'recycling' | 'smart-bin'> = ['bio', 'recycling', 'smart-bin'];
  const names = {
    'bio': ['Community Compost Station', 'Organic Waste Shredder', 'Wet Compost Unit'],
    'recycling': ['Dry Recycling Depot', 'Eco-Hub Collection Point', 'Metal & Paper Recycle Hub'],
    'smart-bin': ['Municipal Smart Trash Bin', 'Public Solar Dustbin', 'Self-Compacting Garbage Unit']
  };

  const centers: NearbyCenter[] = [];

  for (let i = 0; i < 6; i++) {
    // Random location offset within ~2km
    const latOffset = (Math.random() - 0.5) * 0.024;
    const lngOffset = (Math.random() - 0.5) * 0.024;
    const centerLat = lat + latOffset;
    const centerLng = lng + lngOffset;

    // Approximate Euclidean distance in meters
    const dLat = (centerLat - lat) * 111320;
    const dLng = (centerLng - lng) * 111320 * Math.cos(lat * Math.PI / 180);
    const dist = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
    const distText = dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${dist} m`;

    const type = types[i % 3];
    const nameList = names[type];
    const name = `${nameList[Math.floor(Math.random() * nameList.length)]} #${200 + i}`;
    const fillLevel = Math.round(Math.random() * 100);

    centers.push({
      id: `center-${i}`,
      name,
      type,
      coordinates: [centerLat, centerLng],
      fillLevel,
      distanceText: distText,
      distanceVal: dist
    });
  }

  return centers.sort((a, b) => a.distanceVal - b.distanceVal);
}

export default function PublicMapPage() {
  const db = useFirestore();
  const { t } = usePreferences();
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // GPS & Tab States
  const [activeTab, setActiveTab] = useState<'reports' | 'centers'>('reports');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [nearbyCenters, setNearbyCenters] = useState<NearbyCenter[]>([]);
  const [locating, setLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState<number>(5);

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

  const handleLocateUser = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords: [number, number] = [latitude, longitude];
        setUserLocation(coords);
        setMapCenter(coords);
        setMapZoom(14);

        const centers = generateMockCenters(latitude, longitude);
        setNearbyCenters(centers);
        setLocating(false);
      },
      (error) => {
        console.error("GPS access error:", error);
        alert("Failed to read your location. Please check your browser location permissions.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* HEADER */}
      <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-6 h-16 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-cyan-600 dark:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="E-Swachh Logo" className="w-8 h-8 object-contain rounded-md" />
            <h1 className="text-xl font-headline font-bold text-slate-900 dark:text-slate-100 hidden sm:block">
              {activeTab === 'reports' ? (t.impactMap || 'Impact Map') : (t.nearbyLocator || 'Nearby Bins')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'reports' && (
            <Button variant={showHeatmap ? "default" : "outline"} size="sm" onClick={() => setShowHeatmap(!showHeatmap)} className="rounded-xl">
              <Layers className="mr-2 h-4 w-4" /> {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
            </Button>
          )}
          <Button size="sm" asChild className="rounded-xl font-bold">
            <Link href="/report">
              <PlusCircle className="mr-2 h-4 w-4" /> {t.newReport || 'Report Issue'}
            </Link>
          </Button>
        </div>
      </header>

      {/* MAP & SIDEBAR GRID */}
      <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        {/* SIDEBAR */}
        <aside className="w-full md:w-80 bg-white dark:bg-slate-900 border-r dark:border-slate-800 p-6 shrink-0 z-10 overflow-y-auto transition-colors flex flex-col gap-6">
          
          {/* TAB TABS SWITCH */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl shrink-0">
            <button
              className={`flex-1 text-center py-2 text-xs font-bold transition-all rounded-lg ${
                activeTab === 'reports' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
              onClick={() => setActiveTab('reports')}
            >
              {t.impactMap || 'Grievances'}
            </button>
            <button
              className={`flex-1 text-center py-2 text-xs font-bold transition-all rounded-lg ${
                activeTab === 'centers' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
              onClick={() => setActiveTab('centers')}
            >
              {t.nearbyLocator || 'Nearby Bins'}
            </button>
          </div>

          {activeTab === 'reports' ? (
            <div className="space-y-6 flex-1">
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Filter View</h2>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Garbage Collection Delays', 'Overflowing Dustbins', 'Illegal Dumping of Waste', 'Poor Street Cleaning', 'Lack of Public Toilets', 'Open Drains & Unhygienic Areas', 'Potholes & Damaged Roads', 'Broken Footpaths', 'Waterlogging During Rain', 'Poor Drainage Systems', 'Unsafe Bridges & Crossings', 'Encroachment on Public Roads', 'Other'].map(cat => (
                      <Badge 
                        key={cat} 
                        variant={categoryFilter === cat ? "default" : "outline"}
                        className="cursor-pointer text-[10px] px-2 py-1 transition-all rounded-lg"
                        onClick={() => setCategoryFilter(cat)}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Pending', 'In Progress', 'Resolved'].map(status => (
                      <Badge 
                        key={status} 
                        variant={statusFilter === status ? "default" : "outline"}
                        className="cursor-pointer text-[10px] px-2 py-1 transition-all rounded-lg"
                        onClick={() => setStatusFilter(status)}
                      >
                        {status}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t dark:border-slate-800 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Active Reports ({filteredComplaints.length})</h2>
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="animate-spin text-cyan-600" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredComplaints.slice(0, 10).map((c: any) => (
                      <div 
                        key={c.id} 
                        onClick={() => {
                          if (c.location?.latitude && c.location?.longitude) {
                            setMapCenter([c.location.latitude, c.location.longitude]);
                            setMapZoom(16);
                          }
                        }}
                        className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-cyan-600/30 transition-all cursor-pointer group"
                      >
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 transition-colors truncate">{c.title}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 flex items-center gap-0.5">
                          <MapPin size={10} /> {c.location.address}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex-1">
              <div className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Locator</h2>
                <Button 
                  onClick={handleLocateUser} 
                  disabled={locating}
                  className="w-full text-xs font-bold rounded-xl h-11"
                >
                  {locating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Locating...
                    </>
                  ) : (
                    <>
                      <Compass className="mr-2 h-4 w-4 animate-spin-slow" /> Find Bins Near Me
                    </>
                  )}
                </Button>
              </div>

              {userLocation ? (
                <div className="pt-6 border-t dark:border-slate-800 space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Nearest Facilities ({nearbyCenters.length})</h2>
                  <div className="space-y-3">
                    {nearbyCenters.map((bin) => (
                      <div 
                        key={bin.id} 
                        className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-cyan-600/30 transition-all cursor-pointer group"
                        onClick={() => {
                          setMapCenter(bin.coordinates);
                          setMapZoom(16);
                        }}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-cyan-600 transition-colors line-clamp-2">{bin.name}</h4>
                          <Badge className={`text-[8px] h-4 px-1 py-0 uppercase shrink-0 font-bold ${
                            bin.fillLevel >= 80 ? 'bg-red-500 text-white' :
                            bin.fillLevel >= 50 ? 'bg-amber-500 text-white' :
                            'bg-emerald-500 text-white'
                          }`}>
                            {bin.fillLevel}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="capitalize font-semibold text-slate-400">
                            {bin.type === 'bio' ? 'Wet Waste' : bin.type === 'recycling' ? 'Recycling' : 'Smart Bin'}
                          </span>
                          <span className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 font-bold">
                            <MapPin size={9} /> {bin.distanceText}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed dark:border-slate-800 text-slate-400 dark:text-slate-500 space-y-2 mt-4">
                  <MapPin className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-medium">Click the button above to locate nearby smart dustbins and recycling hubs.</p>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* MAP CONTAINER */}
        <main className="flex-1 h-full z-0 relative">
          <MapProvider>
            <MainMap 
              complaints={filteredComplaints} 
              showHeatmap={showHeatmap} 
              userLocation={userLocation}
              nearbyCenters={nearbyCenters}
              center={mapCenter}
              zoom={mapZoom}
            />
          </MapProvider>
        </main>
      </div>
    </div>
  );
}
