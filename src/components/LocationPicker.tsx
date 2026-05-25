
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '350px',
  borderRadius: '0.75rem',
};

const center = {
  lat: 40.7128,
  lng: -74.0060,
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

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
      reverseGeocode(lat, lng);
    }
  }, []);

  const reverseGeocode = (lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const addr = results[0].formatted_address;
        setAddress(addr);
        onLocationSelect({ address: addr, latitude: lat, longitude: lng });
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
        setMarker({ lat, lng });
        setAddress(addr);
        onLocationSelect({ address: addr, latitude: lat, longitude: lng });
      }
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMarker({ lat, lng });
        reverseGeocode(lat, lng);
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
            <input
              type="text"
              placeholder="Search for a location..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Autocomplete>
        </div>
        <Button type="button" variant="outline" size="icon" onClick={handleGetCurrentLocation} title="Use my current location">
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={13}
        center={marker || center}
        onClick={onMapClick}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
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

      {address && (
        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10 text-xs text-primary font-medium">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{address}</span>
        </div>
      )}
    </div>
  );
}
