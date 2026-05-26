'use client';

import React, { useState, useCallback } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

interface LocationPickerProps {
  onLocationSelect: (location: { address: string; latitude: number; longitude: number }) => void;
  initialLocation?: { latitude: number; longitude: number; address: string };
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(
    initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
  );
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const setLocationDetails = (lat: number, lng: number, addr: string) => {
    setMarker({ lat, lng });
    setAddress(addr);
    onLocationSelect({ address: addr, latitude: lat, longitude: lng });
    
    if (map) {
      map.panTo({ lat, lng });
      map.setZoom(16);
    }
  };

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      reverseGeocode(lat, lng);
    }
  }, [map]);

  const reverseGeocode = (lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const addr = results[0].formatted_address;
        setLocationDetails(lat, lng, addr);
      } else {
        // Fallback for click if reverse geocoding fails or API not enabled
        setLocationDetails(lat, lng, `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    });
  };

  const onAutocompleteLoad = (auto: google.maps.places.Autocomplete) => {
    setAutocomplete(auto);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const addr = place.formatted_address || '';
        setLocationDetails(lat, lng, addr);
      }
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        reverseGeocode(lat, lng);
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
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
          <Autocomplete 
            onLoad={onAutocompleteLoad} 
            onPlaceChanged={onPlaceChanged}
          >
            <input
              type="text"
              placeholder="Search for an address or landmark..."
              className="flex h-11 w-full rounded-md border border-input bg-white pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shadow-sm"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Autocomplete>
        </div>
        <Button 
          type="button" 
          variant="outline" 
          size="icon" 
          className="h-11 w-11 shrink-0 bg-white"
          onClick={handleGetCurrentLocation} 
          title="Use my current location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-xl shadow-inner bg-slate-100 border border-slate-200 min-h-[400px]">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={initialLocation ? 16 : 4}
          center={marker || defaultCenter}
          onLoad={onMapLoad}
          onClick={onMapClick}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          }}
        >
          {marker && <Marker position={marker} animation={google.maps.Animation.DROP} />}
        </GoogleMap>
        
        {!marker && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
