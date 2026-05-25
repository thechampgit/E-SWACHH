
'use client';

import React, { useState, useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MapPin, Camera, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 120px)',
};

const center = {
  lat: 40.7128,
  lng: -74.0060,
};

interface MainMapProps {
  complaints: any[];
  showHeatmap?: boolean;
}

export function MainMap({ complaints, showHeatmap = false }: MainMapProps) {
  const [selected, setSelected] = useState<any>(null);

  const heatmapData = useMemo(() => {
    if (!showHeatmap || !complaints) return [];
    return complaints.map(c => new google.maps.visualization.WeightedLocation({
      location: new google.maps.LatLng(c.location.latitude, c.location.longitude),
      weight: c.priority === 'High' ? 3 : c.priority === 'Medium' ? 2 : 1
    }));
  }, [complaints, showHeatmap]);

  const mapOptions = {
    disableDefaultUI: false,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border bg-white shadow-sm">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={12}
        center={center}
        options={mapOptions}
      >
        {!showHeatmap && complaints.map((c) => (
          <Marker
            key={c.id}
            position={{ lat: c.location.latitude, lng: c.location.longitude }}
            onClick={() => setSelected(c)}
            icon={{
              url: getMarkerIcon(c.category),
              scaledSize: new google.maps.Size(30, 30)
            }}
          />
        ))}

        {showHeatmap && heatmapData.length > 0 && (
          <HeatmapLayer data={heatmapData} />
        )}

        {selected && (
          <InfoWindow
            position={{ lat: selected.location.latitude, lng: selected.location.longitude }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="p-1 max-w-[200px] space-y-2">
              {selected.imageUrl && (
                <div className="h-24 w-full rounded overflow-hidden">
                  <img src={selected.imageUrl} className="w-full h-full object-cover" alt="issue" />
                </div>
              )}
              <div className="space-y-1">
                <h4 className="font-bold text-xs truncate">{selected.title}</h4>
                <div className="flex gap-1">
                  <Badge className="text-[8px] h-4 px-1">{selected.category}</Badge>
                  <Badge variant="outline" className="text-[8px] h-4 px-1">{selected.status}</Badge>
                </div>
                <p className="text-[9px] text-slate-500 line-clamp-1">{selected.location.address}</p>
              </div>
              <Button size="sm" variant="ghost" className="w-full h-6 text-[10px] p-0 font-bold" asChild>
                <Link href={`/track/${selected.id}`}>
                  Track <Eye size={10} className="ml-1" />
                </Link>
              </Button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

function getMarkerIcon(category: string) {
  // SVG Pin colors based on category
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
  
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg width="30" height="30" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"/>
    </svg>
  `)}`;
}
