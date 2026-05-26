'use client';

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MapPin } from 'lucide-react';
import Link from 'next/link';

const defaultCenter: [number, number] = [20.5937, 78.9629];

interface MainMapProps {
  complaints: any[];
  showHeatmap?: boolean;
}

export function MainMap({ complaints }: MainMapProps) {
  const getCategoryIcon = useMemo(() => (category: string) => {
    if (typeof window === 'undefined') return null;
    const colors: Record<string, string> = {
      'Road Damage': '#ef4444',
      'Garbage': '#10b981',
      'Water Supply': '#3b82f6',
      'Electricity': '#f59e0b',
      'Streetlight': '#8b5cf6',
      'Drainage': '#06b6d4',
      'Other': '#94a3b8'
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

  if (typeof window === 'undefined') return null;

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border bg-white shadow-sm z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={5} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
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
