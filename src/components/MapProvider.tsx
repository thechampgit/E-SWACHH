'use client';

import React from 'react';
import { useJsApiLoader, Libraries } from '@react-google-maps/api';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { firebaseConfig } from '@/firebase/config';
import { Button } from '@/components/ui/button';

const libraries: Libraries = ['places', 'visualization'];

export function MapProvider({ children }: { children: React.ReactNode }) {
  // Use explicit Maps Key if provided, otherwise fallback to Firebase API Key
  const apiKey = 
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 
    firebaseConfig.apiKey || 
    '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries,
  });

  if (loadError) {
    const isNotActivated = loadError.message.includes('ApiNotActivatedMapError');

    return (
      <div className="p-8 bg-red-50 text-red-900 border border-red-100 rounded-xl flex flex-col items-center gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-red-600" />
        <div className="space-y-2 max-w-md">
          <p className="font-bold text-lg">
            {isNotActivated ? "Maps API Not Activated" : "Map Service Error"}
          </p>
          <p className="text-sm opacity-90 leading-relaxed">
            {isNotActivated 
              ? "The Google Maps JavaScript API is not enabled for your project. You must enable it in the Google Cloud Console to view maps."
              : "There was an issue loading the map. Please ensure your API key is valid and has the correct permissions."}
          </p>
          
          {isNotActivated && (
            <div className="pt-4">
              <Button variant="outline" className="bg-white border-red-200 text-red-700 hover:bg-red-50 gap-2" asChild>
                <a 
                  href="https://console.cloud.google.com/google/maps-apis/api-list" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Enable Maps API <ExternalLink size={14} />
                </a>
              </Button>
              <p className="text-[10px] mt-4 font-mono text-red-500 uppercase font-bold tracking-tighter">
                Required: Maps JavaScript API & Places API
              </p>
            </div>
          )}
          
          {!isNotActivated && <p className="text-[10px] mt-2 font-mono break-all opacity-60">Error: {loadError.message}</p>}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3 bg-slate-50 rounded-xl border border-dashed min-h-[400px] w-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Initializing Spatial Engine</span>
      </div>
    );
  }

  return <div className="w-full h-full min-h-[inherit]">{children}</div>;
}
