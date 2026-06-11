'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MapPin, Navigation, Search, Loader2, LocateFixed } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export type PickedLocation = {
  address: string;
  latitude: number;
  longitude: number;
};

interface LocationPickerProps {
  onLocationSelect: (location: PickedLocation) => void;
  initialLocation?: PickedLocation;
}

const fallbackCenter: [number, number] = [20.5937, 78.9629];
const fallbackAddress = (lat: number, lng: number) => `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: any) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), zoom), { animate: true });
  }, [center, map, zoom]);

  return null;
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.latitude, initialLocation.longitude] : null
  );
  const [watchId, setWatchId] = useState<number | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsCalibrating, setGpsCalibrating] = useState(false);
  const bestAccuracyRef = useRef<number>(Infinity);
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const markerRef = useRef<L.Marker | null>(null);
  const hasRequestedCurrentLocation = useRef(false);

  const customIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;

    return L.divIcon({
      html: `<div class="bg-primary p-2 rounded-full border-2 border-white shadow-lg text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
             </div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });
  }, []);

  const emitLocation = useCallback(
    (lat: number, lng: number, resolvedAddress: string) => {
      const nextLocation = {
        address: resolvedAddress,
        latitude: Number(lat.toFixed(7)),
        longitude: Number(lng.toFixed(7)),
      };

      setAddress(resolvedAddress);
      onLocationSelect(nextLocation);
    },
    [onLocationSelect]
  );

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setPosition([lat, lng]);
      setIsResolvingAddress(true);

      try {
        const params = new URLSearchParams({
          format: 'jsonv2',
          lat: String(lat),
          lon: String(lng),
          zoom: '18',
          addressdetails: '1',
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Reverse geocoding failed with status ${response.status}`);
        }

        const data = await response.json();
        emitLocation(lat, lng, data.display_name || fallbackAddress(lat, lng));
      } catch (error) {
        console.warn('Geocoding error:', error);
        emitLocation(lat, lng, fallbackAddress(lat, lng));
      } finally {
        setIsResolvingAddress(false);
      }
    },
    [emitLocation]
  );

  const startWatchingLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: 'Location unavailable',
        description: 'Your browser does not support geolocation.',
        variant: 'destructive',
      });
      return;
    }

    setIsLocating(true);
    setGpsActive(true);
    setGpsCalibrating(true);
    bestAccuracyRef.current = Infinity;

    const id = navigator.geolocation.watchPosition(
      (geoPosition) => {
        const { latitude, longitude, accuracy: detectedAccuracy } = geoPosition.coords;
        
        // Filter out GPS drift noise by only updating position when accuracy improves or is high precision (<= 15m)
        if (detectedAccuracy < bestAccuracyRef.current || detectedAccuracy <= 15) {
          bestAccuracyRef.current = detectedAccuracy;
          setAccuracy(detectedAccuracy);
          setPosition([latitude, longitude]);
          reverseGeocode(latitude, longitude);
          
          if (detectedAccuracy <= 15) {
            setGpsCalibrating(false);
          }
        }
        setIsLocating(false);
      },
      (error) => {
        console.warn('GPS tracking error:', error);
        setIsLocating(false);
        setGpsActive(false);
        setGpsCalibrating(false);
        toast({
          title: 'GPS Signal Lost',
          description: 'Enable device location services or click the map manually.',
          variant: 'destructive',
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 12000,
      }
    );
    setWatchId(id);
  }, [reverseGeocode]);

  const stopWatchingLocation = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setGpsActive(false);
    setGpsCalibrating(false);
  }, [watchId]);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);

    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        q: query,
        limit: '1',
        addressdetails: '1',
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Location search failed with status ${response.status}`);
      }

      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) {
        toast({ title: 'Location not found', variant: 'destructive' });
        return;
      }

      const latitude = Number.parseFloat(results[0].lat);
      const longitude = Number.parseFloat(results[0].lon);
      const resolvedAddress = results[0].display_name || fallbackAddress(latitude, longitude);

      setAccuracy(null);
      setPosition([latitude, longitude]);
      emitLocation(latitude, longitude, resolvedAddress);
    } catch (error) {
      console.warn('Location search error:', error);
      toast({ title: 'Search failed', description: 'Try a nearby landmark or drag the marker on the map.', variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  }, [emitLocation, searchQuery]);

  const handleGetCurrentLocation = useCallback(
    (showErrorToast = true) => {
      if (!navigator.geolocation) {
        if (showErrorToast) {
          toast({ title: 'Location unavailable', description: 'Your browser does not support geolocation.', variant: 'destructive' });
        }
        return;
      }

      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (geoPosition) => {
          const { latitude, longitude, accuracy: detectedAccuracy } = geoPosition.coords;
          setAccuracy(detectedAccuracy);
          reverseGeocode(latitude, longitude);
          setIsLocating(false);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          setIsLocating(false);

          if (showErrorToast) {
            toast({
              title: 'Location access needed',
              description: 'Enable location services, search manually, or click the map to set the report location.',
              variant: 'destructive',
            });
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000,
        }
      );
    },
    [reverseGeocode]
  );

  useEffect(() => {
    if (initialLocation || hasRequestedCurrentLocation.current) return;

    hasRequestedCurrentLocation.current = true;
    handleGetCurrentLocation(false);
  }, [handleGetCurrentLocation, initialLocation]);

  const markerHandlers = useMemo<L.LeafletEventHandlerFnMap>(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (!marker) return;

        const nextPosition = marker.getLatLng();
        setAccuracy(null);
        reverseGeocode(nextPosition.lat, nextPosition.lng);
      },
    }),
    [reverseGeocode]
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setAccuracy(null);
      reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  if (typeof window === 'undefined') return null;

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
          <Input
            placeholder="Search for an address or landmark..."
            className="pl-10 h-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 bg-white"
            disabled={isSearching}
            onClick={handleSearch}
            aria-label="Search for location"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant={gpsActive ? "default" : "outline"}
            className={cn(
              "h-11 gap-2 text-xs font-bold uppercase tracking-wider rounded-lg px-4 transition-all duration-300",
              gpsActive 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse" 
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
            onClick={gpsActive ? stopWatchingLocation : startWatchingLocation}
            disabled={isLocating}
            title={gpsActive ? "Stop real-time GPS tracking" : "Enable high-accuracy GPS tracking"}
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className={cn("h-4 w-4", gpsActive ? "text-white animate-spin" : "text-emerald-600")} />
            )}
            <span>{gpsActive ? "GPS Active" : "Enable GPS"}</span>
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl shadow-inner bg-slate-100 border border-slate-200 h-[400px] z-0">
        {/* GPS Active/Calibrating Status Pill */}
        {gpsActive && (
          <div className="absolute top-3 right-3 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border dark:border-slate-800 rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider pointer-events-none">
            <span className="relative flex h-2 w-2">
              <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                gpsCalibrating ? "bg-amber-400" : "bg-emerald-400"
              )}></span>
              <span className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                gpsCalibrating ? "bg-amber-500" : "bg-emerald-500"
              )}></span>
            </span>
            <span className={cn(
              "font-mono",
              gpsCalibrating ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
            )}>
              {gpsCalibrating 
                ? `Calibrating (±${Math.round(accuracy || 0)}m)` 
                : `Precision Lock (±${Math.round(accuracy || 0)}m)`}
            </span>
          </div>
        )}
        <MapContainer
          center={position || fallbackCenter}
          zoom={position ? 16 : 4}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onMapClick={handleMapClick} />
          {position && (
            <>
              {accuracy && (
                <Circle
                  center={position}
                  radius={accuracy}
                  pathOptions={{ 
                    color: '#3b82f6', 
                    fillColor: '#3b82f6', 
                    fillOpacity: 0.14, 
                    weight: 1.5,
                    dashArray: gpsCalibrating ? '5, 5' : undefined 
                  }}
                />
              )}
              {customIcon && (
                <Marker
                  draggable
                  eventHandlers={markerHandlers}
                  icon={customIcon}
                  position={position}
                  ref={markerRef}
                />
              )}
              <ChangeView center={position} zoom={gpsActive ? 19 : 16} />
            </>
          )}
        </MapContainer>

        {!position && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border shadow-lg flex items-center gap-2 text-xs font-bold text-slate-600">
              {isLocating ? (
                <>
                  <Loader2 size={14} className="text-primary animate-spin" /> Detecting your location
                </>
              ) : (
                <>
                  <MapPin size={14} className="text-primary" /> Click on map to set location
                </>
              )}
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
            {position && (
              <p className="text-[10px] text-emerald-700/70">
                {position[0].toFixed(6)}, {position[1].toFixed(6)}
                {accuracy ? ` - accuracy ${Math.round(accuracy)}m` : ''}
              </p>
            )}
          </div>
          {isResolvingAddress && <Loader2 className="ml-auto h-4 w-4 shrink-0 animate-spin text-emerald-600" />}
        </div>
      )}

      {position && (
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
          <LocateFixed className="h-3.5 w-3.5" />
          Drag the marker or click the map to correct the exact issue spot.
        </div>
      )}
    </div>
  );
}
