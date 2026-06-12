'use client';

import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MapPin } from 'lucide-react';
import Link from 'next/link';

const defaultCenter: [number, number] = [20.5937, 78.9629];

// Helper to handle dynamic map recentering and zooming
function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

interface MainMapProps {
  complaints: any[];
  showHeatmap?: boolean;
  userLocation?: [number, number] | null;
  nearbyCenters?: any[];
  center?: [number, number];
  zoom?: number;
}

export function MainMap({ complaints, userLocation, nearbyCenters, center, zoom }: MainMapProps) {
  // Category icon mapping for reported complaints
  const getCategoryIcon = useMemo(() => (category: string) => {
    if (typeof window === 'undefined') return null;
    const colors: Record<string, string> = {
      'Garbage Collection Delays': '#3b82f6', // blue
      'Overflowing Dustbins': '#ef4444', // red
      'Illegal Dumping of Waste': '#b91c1c', // dark red
      'Poor Street Cleaning': '#eab308', // yellow
      'Lack of Public Toilets': '#a855f7', // purple
      'Open Drains & Unhygienic Areas': '#ea580c', // orange
      'Potholes & Damaged Roads': '#64748b', // slate
      'Broken Footpaths': '#4b5563', // gray
      'Waterlogging During Rain': '#06b6d4', // cyan
      'Poor Drainage Systems': '#0891b2', // dark cyan
      'Unsafe Bridges & Crossings': '#7c2d12', // brown
      'Encroachment on Public Roads': '#db2777', // pink
      'Other': '#94a3b8' // light gray
    };
    const color = colors[category] || colors['Other'];

    return L.divIcon({
      html: `<div style="color: ${color}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"/>
              </svg>
            </div>`,
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
  }, []);

  // Icon for user's GPS coordinates (pulsing blue dot)
  const userIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return L.divIcon({
      html: `<div class="relative flex h-5 w-5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-white shadow-md"></span>
            </div>`,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }, []);

  // Icons for mock waste disposal and recycling centers
  const getCenterIcon = useMemo(() => (type: string) => {
    if (typeof window === 'undefined') return null;
    const colors: Record<string, string> = {
      'bio': '#10b981', // green for compost/wet waste
      'recycling': '#0284c7', // blue for recycling/dry waste
      'smart-bin': '#0f766e', // teal for municipal smart bin
      'default': '#64748b' // slate for other disposal hubs
    };
    const color = colors[type] || colors['default'];

    return L.divIcon({
      html: `<div style="color: ${color}; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"/>
              </svg>
            </div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });
  }, []);

  if (typeof window === 'undefined') return null;

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border bg-white shadow-sm z-0">
      <MapContainer 
        center={center || defaultCenter} 
        zoom={zoom || 5} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {center && zoom && <RecenterMap center={center} zoom={zoom} />}
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User GPS Location Marker */}
        {userLocation && userIcon && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="p-1.5 text-center">
                <p className="font-bold text-xs text-slate-800">You Are Here</p>
                <p className="text-[9px] text-slate-400 mt-0.5">GPS location active</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Nearby Waste Disposal / Recyclable Center Markers */}
        {nearbyCenters?.map((bin) => {
          const icon = getCenterIcon(bin.type);
          if (!icon) return null;
          return (
            <Marker 
              key={bin.id} 
              position={bin.coordinates}
              icon={icon}
            >
              <Popup>
                <div className="p-2.5 w-[180px] space-y-2">
                  <h4 className="font-bold text-xs text-slate-900 leading-tight">{bin.name}</h4>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 uppercase font-semibold">
                      {bin.type === 'bio' ? 'Wet Waste' : bin.type === 'recycling' ? 'Recycling' : 'Smart Bin'}
                    </Badge>
                    <Badge className={`text-[9px] h-4 px-1 py-0 uppercase font-bold text-white ${
                      bin.fillLevel >= 80 ? 'bg-red-500 hover:bg-red-600' :
                      bin.fillLevel >= 50 ? 'bg-amber-500 hover:bg-amber-600' :
                      'bg-emerald-500 hover:bg-emerald-600'
                    }`}>
                      {bin.fillLevel}% Full
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 flex items-center gap-0.5">
                    <MapPin size={9} /> {bin.distanceText} away
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* Original complaints markers */}
        {complaints.filter(c => c.location?.latitude && c.location?.longitude).map((c) => {
          const icon = getCategoryIcon(c.category);
          if (!icon) return null;
          return (
            <Marker 
              key={c.id} 
              position={[c.location.latitude, c.location.longitude]}
              icon={icon}
            >
              <Popup className="custom-popup">
                <div className="p-3 w-[200px] space-y-3">
                  {c.imageUrl && (
                    <div className="h-28 w-full rounded-md overflow-hidden bg-slate-100">
                      <img src={c.imageUrl} className="w-full h-full object-cover" alt="issue" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{c.title}</h4>
                    <div className="flex flex-wrap gap-1">
                      <Badge className="text-[9px] h-4 px-1 leading-none">{c.category}</Badge>
                      <Badge variant="outline" className="text-[9px] h-4 px-1 leading-none">{c.status}</Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <MapPin size={10} /> <span className="line-clamp-1">{c.location.address}</span>
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" className="w-full h-8 text-[11px] font-bold" asChild>
                    <Link href={`/track/${c.id}`}>
                      Track Resolution <Eye size={12} className="ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
