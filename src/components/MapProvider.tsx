
'use client';

import React from 'react';

/**
 * Leaflet doesn't require a global JS loader like Google Maps.
 * This provider now serves as a simple pass-through to maintain layout consistency.
 */
export function MapProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full min-h-[inherit] relative">
      {children}
    </div>
  );
}
