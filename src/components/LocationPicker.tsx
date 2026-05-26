
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

// Fix for default marker icons in Leaflet with Next.js
const customIcon = L.divIcon({
  html: `<div class="bg-primary p-2 rounded-full border-2 border-white shadow-lg text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
         </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

interface LocationPickerProps {
  onLocationSelect: (location: { address: string; latitude: number; longitude: number }) => void;
  initialLocation?: { latitude: number; longitude: number; address: string };
}

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.latitude, initialLocation.longitude] : null
  );
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      const addr = data.display_name || `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(addr);
      setPosition([lat, lng]);
      onLocationSelect({ address: addr, latitude: lat, longitude: lng });
    } catch (error) {
      console.warn('Geocoding error:', error);
      const fallbackAddr = `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(fallbackAddr);
      setPosition([lat, lng]);
      onLocationSelect({ address: fallbackAddr, latitude: lat, longitude: lng });
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const results = await response.json();
      if (results && results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        setPosition([latitude, longitude]);
        setAddress(display_name);
        onLocationSelect({ address: display_name, latitude, longitude });
      } else {
        toast({ title: "Location not found", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        reverseGeocode(latitude, longitude);
      }, () => {
        toast({
          title: "Location Access Denied",
          description: "Please enable location services or search manually.",
          variant: "destructive"
        });
      });
    }
  };

  return (
    <div className="space-y-4 w-full">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
          <Input
            placeholder="Search for an address or landmark..."
            className="pl-10 h-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button 
          type="submit" 
          variant="outline" 
          size="icon" 
          className="h-11 w-11 bg-white"
          disabled={isSearching}
        >
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="icon" 
          className="h-11 w-11 bg-white"
          onClick={handleGetCurrentLocation} 
          title="Use my current location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </form>

      <div className="relative overflow-hidden rounded-xl shadow-inner bg-slate-100 border border-slate-200 h-[400px] z-0">
        <MapContainer 
          center={position || [20.5937, 78.9629]} 
          zoom={position ? 15 : 4} 
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onMapClick={reverseGeocode} />
          {position && (
            <>
              <Marker position={position} icon={customIcon} />
              <ChangeView center={position} />
            </>
          )}
        </MapContainer>
        
        {!position && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border shadow-lg flex items-center gap-2 text-xs font-bold text-slate-600 animate-bounce">
              <MapPin size={14} className="text-primary" /> Click on map to set location
            </div>
          </div>
        )}
      </div>

      {address && (
        <div className="flex items-start gap-2 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs text-emerald-700 font-medium">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-widest text-[10px] text-emerald-600/60">Selected Location</p>
            <p>{address}</p>
          </div>
        </div>
      )}
    </div>
  );
}
