
'use client';

import React from 'react';
import { useJsApiLoader, Libraries } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

const libraries: Libraries = ['places', 'visualization'];

export function MapProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  if (loadError) {
    return (
      <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg">
        Map could not be loaded. Please check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
