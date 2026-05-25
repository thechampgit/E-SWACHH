
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const mapContainerStyle = {
  width: '100%',
  height: '350px',
  borderRadius: '0.75rem',
};

// Center of India
const center = {
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
  const [error, setError] = useState<string | null>(null);

  const validateAndSetLocation = (lat: number, lng: number, addr: string, results: google.maps.GeocoderResult[]) => {
    // Check if the country is India
    const countryComponent = results[0]?.address_components.find(c => c.types.includes('country'));
    
    if (countryComponent && (countryComponent.short_name === 'IN' || countryComponent.long_name === 'India')) {
      setError(null);
      setMarker({ lat, lng });
      setAddress(addr);
      onLocationSelect({ address: addr, latitude: lat, longitude: lng });
    } else {
      setError("Reporting is restricted to India only. Please select a valid location within Indian territory.");
      toast({
        variant: "destructive",
        title: "Invalid Location",
        description: "CivicPulse currently only supports reports within India."
      });
    }
  };

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      reverseGeocode(lat, lng);
    }
  }, []);

  const reverseGeocode = (lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const addr = results[0].formatted_address;
        validateAndSetLocation(lat, lng, addr, results);
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
        
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            validateAndSetLocation(lat, lng, addr, results);
          }
        });
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
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Autocomplete 
            onLoad={onAutocompleteLoad} 
            onPlaceChanged={onPlaceChanged}
            options={{
              componentRestrictions: { country: 'IN' }
            }}
          >
            <input
              type="text"
              placeholder="Search for a location in India..."
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

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs font-medium">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={5}
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

      {address && !error && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700 font-medium">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{address}</span>
        </div>
      )}
    </div>
  );
}
