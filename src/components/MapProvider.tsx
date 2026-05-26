'use client';

import React from 'react';
import { useJsApiLoader, Libraries } from '@react-google-maps/api';
import { Loader2, AlertCircle } from 'lucide-react';
import { firebaseConfig } from '@/firebase/config';

const libraries: Libraries = ['places', 'visualization'];

export function MapProvider({ children }: { children: React.ReactNode }) {
  // Priority: 1. Specific Maps Key, 2. Firebase Key from Env, 3. Hardcoded Firebase Key
  const apiKey = 
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
    firebaseConfig.apiKey || 
    '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  if (loadError) {
    return (
      <div className="p-8 bg-red-50 text-red-900 border border-red-100 rounded-xl flex flex-col items-center gap-4 text-center">
        <AlertCircle className="h-8 w-8 text-red-600" />
        <div className="space-y-1">
          <p className="font-bold">Map Service Error</p>
          <p className="text-sm opacity-80">
            The Google Maps API key might be missing permissions. Please ensure "Maps JavaScript API" and "Places API" are enabled in your Google Cloud Console for this key.
          </p>
          <p className="text-[10px] mt-2 font-mono break-all opacity-60">Error: {loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3 bg-slate-50 rounded-xl border border-dashed">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Initializing Spatial Engine</span>
      </div>
    );
  }

  return <>{children}</>;
}
