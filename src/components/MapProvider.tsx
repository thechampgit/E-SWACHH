'use client';

import React from 'react';
import { useJsApiLoader, Libraries } from '@react-google-maps/api';
import { Loader2, AlertCircle } from 'lucide-react';

const libraries: Libraries = ['places', 'visualization'];

export function MapProvider({ children }: { children: React.ReactNode }) {
  // Use the Maps key if provided, otherwise fallback to the Firebase API key which is often the same project key
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  if (loadError) {
    return (
      <div className="p-8 bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-xl flex flex-col items-center gap-4 text-center">
        <AlertCircle className="h-8 w-8 text-emerald-600" />
        <div className="space-y-1">
          <p className="font-bold">Map Service Unavailable</p>
          <p className="text-sm opacity-80">The geolocation service is currently being updated. Please try again later or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Loading Intelligence Map</span>
      </div>
    );
  }

  return <>{children}</>;
}
